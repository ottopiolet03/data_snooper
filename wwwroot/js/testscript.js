

let configs; 
let all_configs;
let current_database ="";
let current_server = "";

$(document).ready(function () {
    load_configs();
}); 


function load_configs() {
    fetch('/load_configs').then(res => {
        res.json().then(d => {
            all_configs = d;
            for (let key in d) {
                let table = $(`tbody`);
                let output = `<tr class="data" id="${d[key].server}.${d[key].database}">
                                <td>${d[key].server}</td>
                                <td class="database">${d[key].database}</td>
                                <td>${d[key].username}</td>
                                <td>${d[key].password}</td>
                            </tr>`
                $(output).appendTo(table);
            }
            $('.data').on('click', function (e) {
                let row = $(e.target).closest('tr');
                current_database = row.children()[1].innerHTML;
                current_server =row.children()[0].innerHTML;
                configs = Object.fromEntries(Object.entries(all_configs).filter((key, value) => key[1].server == current_server));
                $('tr').removeClass('highlighted');
                row.attr('class', 'data highlighted');

            });
        });
    });
}

function clear_inputs() {
    $('#database_input').val('');
    $('#server_input').val('');
    $('#username_input').val('');
    $('#password_input').val('');
}

$(`#add_config`).on('click', event => {
    //get input fields
    let database = document.getElementById('database_input').value;
    let server = document.getElementById('server_input').value;
    let username = document.getElementById('username_input').value;
    let password = document.getElementById('password_input').value;

    fetch('/insert_sql', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({ database: database, server: server, username: username, password: password })
    }).then(function (res) {
        res.json().then(d => console.log(d));

        let table = $(`tbody`);
        let output = `<tr class="data" id="${server}.${database}">
                                <td>${server}</td>
                                <td class="database">${database}</td>
                                <td>${username}</td>
                                <td>${password}</td>
                            </tr>`
        $(output).appendTo(table);

        $('.data').on('click', function (e) {
            let row = $(e.target).closest('tr');
            current_database = row.children()[1].innerHTML;
            current_server = row.children()[0].innerHTML;
            configs = Object.fromEntries(Object.entries(all_configs).filter((key, value) => key[1].server == current_server));
            $('tr').removeClass('highlighted');
            row.attr('class', 'data highlighted');

        });
        clear_inputs(); 
    });
});

$(`#table_delete`).on('click', event => {
    //get input fields
    let database = current_database;
    let server = current_server;
    fetch('/remove_sql', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({ database: database, server: server })
    }).then(function (res) {
        res.json().then(d => {
            document.getElementById(`${d.server}.${d.database}`).remove();
            current_database = "";
            current_server = "";
        });
    });
});


$('#clear_inputs').on('click', event => {
    clear_inputs();
    
});

$('#table_load').on('click', event => {
    if (current_database == "" || current_server == "") {
        console.error('No database selected');
    }
    else {
        fetch('/load', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify({ database: current_database, server: current_server, configs: configs })
        }).then(res => {
            window.location.replace('/graph.html');
        })
    }
});

