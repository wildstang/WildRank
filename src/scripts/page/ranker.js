/**
 * file:        ranker.js
 * description: Selection page which sorts a list of teams based off a given smart stat criteria.
 *              Can also be used to build picklists and new smart stats.
 * author:      Liam Fruzyna
 * date:        2020-03-13
 *              2021-11-19
 */
include('stat-builders')

const STAT_TYPES = ['Filter', 'Map', 'Math', 'Min/Max', 'Wgtd Rank', 'Where']

var stat_builder
var params_el, name_entry, stat_type
var team_order = []

/**
 * Populates the core elements of the page.
 */
function init_page()
{
    header_info.innerText = 'Stat Builder'

    // build static components
    let page = new WRPage()
    let builder_col = new WRColumn('Build Stat')
    page.add_column(builder_col)

    name_entry = new WREntry('Name', 'New Stat')
    builder_col.add_input(name_entry)

    stat_type = new WRSelect('Type', STAT_TYPES, 'Filter')
    stat_type.on_change = update_params
    builder_col.add_input(stat_type)

    params_el = document.createElement('div')
    builder_col.add_input(params_el)

    let button_col = new WRColumn('Save')
    page.add_column(button_col)

    let save_stat_el = new WRButton('Save Stat to Config', save_stat)
    button_col.add_input(save_stat_el)

    let save_list_el = new WRButton('Save Rankings as Picklist', save_list)
    button_col.add_input(save_list_el)

    let edit_stats = new WRLinkButton('Edit Stats', build_url('edit-stats'))
    button_col.add_input(edit_stats)

    preview.replaceChildren(page)
    enable_list(false)

    // build dynamic components
    update_params()
}

/**
 * Updates the inputs at the bottom of the page corresponding to the static inputs' values.
 */
function update_params()
{
    let type = stat_type.selected_option

    // add appropriate inputs for the selected type
    let page = new WRPage()
    switch (type)
    {
        case 'Filter':
            stat_builder = new FilterStat()
            break
        case 'Map':
            stat_builder = new MapStat()
            break
        case 'Math':
            stat_builder = new MathStat()
            break
        case 'Min/Max':
            stat_builder = new MinMaxStat()
            break
        case 'Wgtd Rank':
            stat_builder = new WeightedRankStat()
            break
        case 'Where':
            stat_builder = new WhereStat()
            break
    }
    for (let c of stat_builder.build_interface())
    {
        page.add_column(c)
    }
    params_el.replaceChildren(page)

    stat_builder.initialize()

    // always update the calculations on any change
    calculate()
}

/**
 * Builds a new smart result based on the selected options.
 * @returns Result representing the smart result designed on the page.
 */
function build_smart_result()
{
    stat = stat_builder.build_stat()
    if (stat)
    {
        let name = name_entry.element.value
        stat.name = name
        stat.id = create_id_from_name(name)

        return Result.from_object(stat)[0]
    }
}

/**
 * Populates the selection column with teams and values, in order by computed smart result value.
 */
function calculate()
{
    let result = build_smart_result()
    if (!result)
    {
        return
    }

    // compute smart result for each team
    let team_vals = {}
    for (let team_num of dal.team_numbers)
    {
        if (stat.is_team_smart_result)
        {
            let value = result.compute_smart_result(dal.teams[team_num])
            if (value !== null)
            {
                team_vals[team_num] = value
            }
        }
        else
        {
            if (result.recompute)
            {
                let value = result.compute_smart_result(null, team_num)
                if (value !== null)
                {
                    team_vals[team_num] = value
                }
            }
            else
            {
                let match_results = []
                for (let match_key of dal.teams[team_num].matches)
                {
                    let value = result.compute_smart_result(dal.get_match_result(match_key, team_num))
                    if (value !== null)
                    {
                        match_results.push(value)
                    }
                }
                if (match_results.length > 0)
                {
                    team_vals[team_num] = result.compute_stat(match_results)
                }
            }
        }
    }
    
    // sort teams and populate left
    team_order = Object.keys(team_vals).sort((a,b) => team_vals[b] - team_vals[a])
    if (result.negative)
    {
        team_order.reverse()
    }

    clear_list(false)
    for (let i in team_order)
    {
        let team_num = team_order[i]
        let val = result.clean_value(team_vals[team_num])

        if (++i < 10)
        {
            i = `&nbsp;${i}`
        }
        if (team_num < 10)
        {
            team_num = `&nbsp;&nbsp;&nbsp;&nbsp;${team_num}`
        }
        else if (team_num < 100)
        {
            team_num = `&nbsp;&nbsp;&nbsp;${team_num}`
        }
        else if (team_num < 1000)
        {
            team_num = `&nbsp;&nbsp;${team_num}`
        }
        else if (team_num < 10000)
        {
            team_num = `&nbsp;${team_num}`
        }
        
        let title = `${i} ${team_num} ${val}`
        let op = new WROption(title, title)
        add_option(op, false)
    }
}


/**
 * Adds the current smart result to the config and triggers it to save to localStorage.
 */
function save_stat()
{
    let stat = build_smart_result()
    if (cfg.get_keys().includes(stat.full_id))
    {
        alert('Smart result already exists!')
    }
    else if (!stat)
    {
        alert('Missing inputs!')
    }
    else
    {
        let tests = stat.validate(false).filter(t => t !== true)
        if (tests.length === 0)
        {
            cfg.analysis.smart_results.push(stat)
            cfg.analysis.store_config()
            dal.load_data()
            update_params()
            alert(`${stat.name} Created`)
        }
        else
        {
            alert('Invalid smart result!\n\n' + tests.join('\n\n'))
        }
    }
}

/**
 * Saves the current sort order as a picklist.
 */
function save_list()
{
    let name = name_entry.element.value
    dal.picklists[name] = team_order
    dal.save_picklists()
    alert(`${name} Created`)
}