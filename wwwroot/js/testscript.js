
let databases = [];
let servers = [];
let usernames = {};
let passwords = {};

$(`#load_config`).on('click', event => {
    fetch('/load_configs').then(res => {
        res.json().then(d => {
            console.log(d);
            $(`#config_output`).html(d);
        });
    });
}); 

$('#load_graph').on('click', event => {
    console.log('g');
    fetch('/').then(res => {
        
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

$('#clear').on('click', event => {
    $('#database').html('');
    $('#server').html('');
    $('#username').html('');
    $('#password').html('');
});