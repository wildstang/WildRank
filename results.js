var urlParams = new URLSearchParams(window.location.search)
const type = urlParams.get('type')

window.addEventListener('load', function () {
    let files = Object.keys(localStorage)
    headers = true
    files.forEach(function (file, index)
    {
        if (file.startsWith(type + "-"))
        {
            if (headers)
            {
                add_results_row(file, true)
                headers = false
            }
            add_results_row(file)
        }
    })
})

function add_results_row(file, header=false)
{
    let = results = JSON.parse(localStorage.getItem(file))
    let row_str = "<tr>"
    
    if (header)
    {
        row_str += "<td>file</td>"
    }
    else
    {
        row_str += "<td>" + file + "</td>"
    }
    
    for (var key of Object.keys(results))
    {
        if (header)
        {
            row_str += "<td>" + key + "</ts>"
        }
        else
        {
            row_str += "<td>" + results[key] + "</td>"
        }
    }

    row_str += "</tr>"
    document.getElementById("results_tab").innerHTML += row_str
}