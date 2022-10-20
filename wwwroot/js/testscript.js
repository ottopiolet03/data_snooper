
let database;


$(`#load_config`).on('click', event => {
    fetch('/load_configs').then(res => {
        res.json().then(d => {
            console.log(d);
            $(`#config_output`).html(d);
        });
    });
}); 
 

$(`#add_config`).on('click', event => {
    //get input fields
    let database = document.getElementById('database').value;
    let server = document.getElementById('server').value;
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;

    fetch('/insert_sql', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({ database: database, server: server, username: username, password: password })
    }).then(function (res) {
        res.json().then(d => console.log(d));
    });
});

$(`#remove_config`).on('click', event => {
    //get input fields
    let database = document.getElementById('database').value;

    fetch('/remove_sql', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({ database: database})
    }).then(function (res) {
        res.json().then(d => console.log(d));
    });
});


$('#clear').on('click', event => {
    $('#database').html('');
    $('#server').html('');
    $('#username').html('');
    $('#password').html('');
});

$('#load_graph').on('click', event => {
    fetch('/', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({ database: document.getElementById('database').value})
    }).then(res => {
        window.location.replace(res.url + 'index.html');
        
    })
});