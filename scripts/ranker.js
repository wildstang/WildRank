/**
 * file:        ranker.js
 * description: Selection page which sorts a list of teams based off a given smart stat criteria.
 *              Can also be used to build picklists and new smart stats.
 * author:      Liam Fruzyna
 * date:        2020-03-13
 *              2021-11-19
 */
include('stat-builders')

const STAT_TYPES = ['Math', 'Percent', 'Ratio', 'Where', 'Min/Max', 'Filter', 'Wgtd Rank', 'Map']

var stat_builder
var params_el, picklist_filter, name_entry, stat_type

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch results from localStorage. Initialize page contents.
 */
function init_page()
{
    header_info.innerText = 'Stat Builder'

    // build picklist filter
    picklist_filter = add_dropdown_filter(['None'].concat(Object.keys(dal.picklists)), update_params, true)

    // build static components
    let page = new WRPage()
    let builder_col = new WRColumn('Build Stat')
    page.add_column(builder_col)

    name_entry = new WREntry('Name', 'New Stat')
    builder_col.add_input(name_entry)

    stat_type = new WRSelect('Type', STAT_TYPES, 'Math')
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

    let edit_stats = new WRLinkButton('Edit Stats', open_page('edit-stats'))
    button_col.add_input(edit_stats)

    preview.replaceChildren(page)

    // build dynamic components
    update_params()
}

/**
 * function:    update_params
 * parameters:  none
 * returns:     none
 * description: Updates the inputs at the bottom of the page corresponding to the static inputs' values.
 */
function update_params()
{
    let type = stat_type.selected_option

    // add appropriate inputs for the selected type
    let page = new WRPage()
    switch (type)
    {
        case 'Sum':
            stat_builder = new SumStat()
            break
        case 'Math':
            stat_builder = new MathStat()
            break
        case 'Percent':
            stat_builder = new PercentStat()
            break
        case 'Ratio':
            stat_builder = new RatioStat()
            break
        case 'Where':
            stat_builder = new WhereStat()
            break
        case 'Min/Max':
            stat_builder = new MinMaxStat()
            break
        case 'Filter':
            stat_builder = new FilterStat()
            break
        case 'Wgtd Rank':
            stat_builder = new WeightedRankStat()
            break
        case 'Map':
            stat_builder = new MapStat()
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
 * function:    build_stat
 * parameters:  none
 * returns:     smart stat object
 * description: Builds a smart stat object corresponding to the inputs selected on the page.
 */
function build_stat()
{
    stat = stat_builder.build_stat()

    let name = name_entry.value
    stat.name = name
    stat.id = create_id_from_name(name)

    return stat
}

/**
 * function:    calculate
 * parameters:  none
 * returns:     none
 * description: Calculates each team's stat based on the current inputs.
 */
function calculate()
{
    let name = name_entry.value
    let id = create_id_from_name(name)
    let stat = build_stat()
    if (!stat)
    {
        return
    }
    console.log(stat)

    // filter teams
    let picklist = []
    if (Object.keys(dal.picklists).length > 0)
    {
        let selected = picklist_filter.element.value
        if (selected !== 'None')
        {
            picklist = dal.picklists[selected]
        }    
    }

    // get team smart stat results
    let team_res = {}
    let result_names = stat.pit ? dal.get_pits(picklist) : dal.get_results(picklist)
    for (let res of result_names)
    {
        if (typeof team_res[res.meta_team] === 'undefined')
        {
            team_res[res.meta_team] = [] 
        }
        let result = dal.add_smart_stats(res, [stat], stat.pit ? 'pit' : 'results')[id]
        if (typeof result !== 'undefined')
        {
            team_res[res.meta_team].push(result)
        }
    }

    // average each set of team results
    let team_vals = {}
    for (let team of Object.keys(team_res))
    {
        if (stat.type !== 'min' && stat.type !== 'max')
        {
            team_vals[team] = mean(team_res[team])
        }
        else
        {
            team_vals[team] = median(team_res[team])
        }
    }
    
    // sort teams and populate left
    let teams = Object.keys(team_vals)
    teams.sort((a,b) => team_vals[b] - team_vals[a])
    team_order = [...teams]
    teams = teams.map(function (t, i)
    {
        let val = team_vals[t]
        if (stat.type !== 'min' && stat.type !== 'max')
        {
            val = val.toFixed(2)
            if (isNaN(val))
            {
                val = '0.0'
            }
        }
        if (++i < 10)
        {
            i = `&nbsp;${i}`
        }
        if (t < 10)
        {
            t = `&nbsp;&nbsp;&nbsp;${t}`
        }
        else if (t < 100)
        {
            t = `&nbsp;&nbsp;${t}`
        }
        else if (t < 1000)
        {
            t = `&nbsp;${t}`
        }
        return `${i} ${t} ${val}`
    })

    if (stat.negative)
    {
        teams.reverse()
    }

    populate_other(teams)
}

/**
 * function:    save_stat
 * parameters:  none
 * returns:     none
 * description: Adds the current smart stat to the config for use in other pages.
 */
function save_stat()
{
    let stat = build_stat()
    if (dal.meta.hasOwnProperty(`results.${stat.id}`))
    {
        alert('Stat already exists!')
    }
    else if (!stat)
    {
        alert('Missing inputs!')
    }
    else
    {
        cfg.smart_stats.push(stat)
        localStorage.setItem(`config-${cfg.year}-smart_stats`, JSON.stringify(cfg.smart_stats))
        dal.build_teams()
        update_params()
        alert(`${stat.name} Created`)
    }
}

/**
 * function:    save_list
 * parameters:  none
 * returns:     none
 * description: Saves the current order of teams as a picklist.
 */
function save_list()
{
    let name = name_entry.value
    dal.picklists[name] = team_order
    dal.save_picklists()
    alert(`${name} Created`)
}