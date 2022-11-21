
 
let all_configs;

$(document).ready(function () {
    load_configs();
}); 


function load_configs() {
    fetch('/load_configs').then(res => {
        res.json().then(d => {
            all_configs = d;
            for (let key in d) {
                let table = $(`tbody`);
                let password = "".padStart(d[key].password.length, '*');
                let output = `<tr class="data" id="${d[key].server}.${d[key].database}">
                                <td value="${d[key].server}" class="col-xs-3">${d[key].server}</td>
                                <td class="database col-xs-3">${d[key].database}</td>
                                <td class="col-xs-3">${d[key].username}</td>
                                <td class="col-xs-3" type="password">${password}</td>
                                <td class="col-xs-6"><button class="btn load">Load</button></th>
                                <td class="col-xs-6"><button class="btn delete">Delete</button></th>
                            </tr>`
                $(output).appendTo(table);
            }
            
            add_delete_func();
            add_load_func();
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
    event.preventDefault();
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
        all_configs[database] = { database: database, server: server, username: username, password: password };
        let table = $(`tbody`);
        password = "".padStart(password.length, '*');
        let output = `<tr class="data" id="${server}.${database}">
                                <td class="col-xs-3">${server}</td>
                                <td class="database col-xs-3">${database}</td>
                                <td class="col-xs-3">${username}</td>
                                <td class="col-xs-3">${password}</td>
                                <td class="col-xs-6"><button class="btn load">Load</button></th>
                                <td class="col-xs-6"><button class="btn delete">Delete</button></th>
                            </tr>`
        $(output).appendTo(table);

        add_delete_func();
        add_load_func();
        clear_inputs(); 
    });
});

function add_delete_func() {
    $(`.delete`).on('click', event => {
        //get input fields
        let row = $(event.target).closest('tr');
        let database = row.children()[1].innerHTML;
        let server = row.children()[0].innerHTML;
        fetch('/remove_sql', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify({ database: database, server: server })
        }).then(function (res) {
            res.json().then(d => {
                delete all_configs[database];
                document.getElementById(`${d.server}.${d.database}`).remove();
            });
        });
    });
}


$('#clear_inputs').on('click', event => {
    event.preventDefault();
    clear_inputs();
    
});

function add_load_func() {
    $('.load').on('click', event => {
        let row = $(event.target).closest('tr');
        let database = row.children()[1].innerHTML;
        let server = row.children()[0].innerHTML;
        let configs = Object.fromEntries(Object.entries(all_configs).filter((key, value) => key[1].server == server));

        fetch('/load', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify({ database: database, server: server, configs: configs })
        }).then(res => {
            //window.location.replace('/graph.html');
        }).catch(error => console.log(error));
    });
}

