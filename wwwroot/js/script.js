
var width = window.innerWidth - 10,
    height = .8 * window.innerHeight,
    color = d3.scale.category10();

// force layout setup
var force = d3.layout.force()
    .charge(-1000)
    .linkDistance(200)
    .size([width, height]);

// setup svg div
var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("pointer-events", "all")

let data;
fetch('/data').then(function (res) {
    res.json().then(d => { 
        data = { 'vertices': d.vertices._items, 'edges': d.edges._items };    
        var nodes = {}, links = {}, types = [];
        
        //d3.json("data/graph-of-the-gods.json", function (error, graph) {
        let graph = data;
        // assign vertices to nodes array
        graph.vertices.forEach(function (vertex) {
            nodes[vertex.id] = { label: vertex.label, type: vertex.label, id: vertex.id, schema: vertex.properties.schema[0].value, /*last_accessed: vertex.properties.last_accessed[0].value, schema: vertex.properties.schema[0].value */};
            if (types.indexOf(vertex.label) === -1) {
                types.push(vertex.label);
            }
        });

        // assign edges to links array
        graph.edges.forEach(function (edge) {
            links[edge.id] = { source: nodes[edge.outV], target: nodes[edge.inV], label: edge.label };
        });


        //make SVG graph, appends to svg object already created
        function newSVG(nodes, links) {
            

            force.nodes(d3.values(nodes))
                .links(d3.values(links))
                .on("tick", tick)
                .start();

            // define arrow markers for graph links
            svg.append("defs").append("marker")
                .attr("id", "arrow-head")
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 35)
                .attr("refY", 0)
                .attr("markerWidth", 8)
                .attr("markerHeight", 8)
                .attr("orient", "auto")                                  //to switch arrow directions, auto => auto-start-reverse
                .append("path")
                .attr("fill", "#666")
                .attr("stroke", "#666")
                .attr("stroke-width", "3px")
                .attr("d", "M0,-5L10,0L0,5Z");



            // line displayed for links
            var path = svg.append("g").selectAll("path")
                .data(force.links())
                .enter().append("path")
                .attr("stroke", "#666")
                .attr("class", function (d) { return d.label; })
                .attr("marker-end", "url(#arrow-head)");                 //to switch arrow directions, marker-end => marker-start

            // label displayed for links
            var label = svg.append("g").selectAll("text")
                .data(force.links())
                .enter().append("text")
                .attr("class", "link-label")
                .attr("x", 0)
                .attr("y", ".31em")
                .text(function (d) { return d.label; });

            // color according to nodes type
            var o = d3.scale.ordinal()
                .domain(types)
                .rangePoints([0, 5]);

            // circle displayed for nodes
            var circle = svg.append("g").selectAll("circle")
                .data(force.nodes())
                .enter().append("circle")
                .attr("r", 30)
                .style("fill", function (d) { return color(o(d.type)); })
                .attr("id", data => data.id)
                .attr("name", "circle")
                .call(force.drag)
                .on("mouseover", function (d) {
                    d3.select(this)
                        .style("stroke", "yellow");

                })
                //highlight when hovered
                .on("mouseout", function () {
                    d3.select(this)
                        .style("stroke", "#666");
                })
                .on("click", function () {
                    //get data
                    var dat = d3.select(this).data();
                    var node_id = dat[0].id;
                    var node_last_accessed = dat[0].last_accessed;
                    var node_schema = dat[0].schema;
                    var node_label = dat[0].label;
                    //clear previous data
                    $('#node_id').html('');
                    $('#node_last_accessed').html('');
                    $('#node_schema').html('');
                    $('#node_label').html('');
                    //enter new data
                    document.getElementById('node_id').insertAdjacentText('afterbegin', node_id);
                    document.getElementById('node_last_accessed').insertAdjacentText('afterbegin', node_last_accessed + " days ago");
                    document.getElementById('node_schema').insertAdjacentText('afterbegin', node_schema);
                    document.getElementById('node_label').insertAdjacentText('afterbegin', node_label);
                });

            circle.append("title")
                .text(function (d) { return d.type; });

            // label displayed for nodes
            var text = svg.append("g").selectAll("text")
                .data(force.nodes())
                .enter().append("text")
                .attr("class", "node-label")
                .attr("x", 0)
                .attr("y", ".31em")
                .text(function (d) { return d.label; });

            // attach transformation attributes to nodes and links
            function tick() {
                path.attr("d", linkArrow);
                label.attr("transform", linkLabel);
                circle.attr("transform", transform);
                text.attr("transform", transform);
            }

            function linkArrow(d) {
                return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
            }

            function linkLabel(d) {
                var x = (d.source.x + d.target.x) / 2,
                    y = (d.source.y + d.target.y) / 2;
                var dx = d.target.x - x,
                    dy = d.target.y - y;
                var theta = Math.atan2(dy, dx);
                theta *= 180.0 / Math.PI;

                return "rotate(" + theta + "," + x + "," + y + ")translate(" + x + "," + (y - 8) + ")";
            }

            function transform(d) {
                return "translate(" + d.x + "," + d.y + ")";
            }

        };
        
        newSVG(nodes, links);
        function clear_svg() {
            svg.selectAll('g').remove();
            svg.select('def').remove();
        }
        //search field code -----------------------------------------------------------------------------------------------
       

        var search_box = document.getElementById("search_input");
        var search_input = document.getElementById("search_drop_down");

        function highlightNodes(e, input, search_type) {
            //d3.selectAll('circle').attr('class', 'dim');
            let newNodes = {};
            let newLinks = {};

            switch (search_type) {
                case 'id':
                    for (let n in nodes) {
                        //add nodes and edges
                        if (n == input) {                                                      //only this line changes in each case
                            newNodes[n] = nodes[n];
                            for (link_ind in links) {
                                if (links[link_ind].source.id == n) {
                                    let child = links[link_ind].target.id;
                                    newNodes[child] = nodes[child];
                                    newLinks[link_ind] = links[link_ind];
                                }
                                else if (links[link_ind].target.id == n) {
                                    let parent = links[link_ind].source.id;
                                    newNodes[parent] = nodes[parent];
                                    newLinks[link_ind] = links[link_ind];
                                }
                            }
                        }
                    }

                    //remove old graph
                    clear_svg();
                    //create new graph
                    newSVG(newNodes, newLinks);
                    break;
                case 'type':
                    for (let n in nodes) {
                        if (nodes[n].type.toLowerCase() == input.toLowerCase()) {      
                            newNodes[n] = nodes[n];
                            for (link_ind in links) {
                                if (links[link_ind].source.id == n) {
                                    let child = links[link_ind].target.id;
                                    newNodes[child] = nodes[child];
                                    newLinks[link_ind] = links[link_ind];
                                }
                                else if (links[link_ind].target.id == n) {
                                    let parent = links[link_ind].source.id;
                                    newNodes[parent] = nodes[parent];
                                    newLinks[link_ind] = links[link_ind];
                                }
                            }
                        }
                    }
                    clear_svg();
                    newSVG(newNodes, newLinks);
                    break;
                case 'schema':
                    for (let n in nodes) {
                        if (nodes[n].schema.toLowerCase() == input.toLowerCase()) {
                            newNodes[n] = nodes[n];
                            for (link_ind in links) {
                                if (links[link_ind].source.id == n) {
                                    let child = links[link_ind].target.id;
                                    newNodes[child] = nodes[child];
                                    newLinks[link_ind] = links[link_ind];
                                }
                                else if (links[link_ind].target.id == n) {
                                    let parent = links[link_ind].source.id;
                                    newNodes[parent] = nodes[parent];
                                    newLinks[link_ind] = links[link_ind];
                                }
                            }
                        }
                    }
                    clear_svg();
                    newSVG(newNodes, newLinks);
                    break;
                case 'last_accessed':
                    for (let n in nodes) {
                        if (nodes[n].last_accessed == input) {
                            newNodes[n] = nodes[n];
                            for (link_ind in links) {
                                if (links[link_ind].source.id == n) {
                                    let child = links[link_ind].target.id;
                                    newNodes[child] = nodes[child];
                                    newLinks[link_ind] = links[link_ind];
                                }
                                else if (links[link_ind].target.id == n) {
                                    let parent = links[link_ind].source.id;
                                    newNodes[parent] = nodes[parent];
                                    newLinks[link_ind] = links[link_ind];
                                }
                            }
                        }
                    }
                    clear_svg();
                    newSVG(newNodes, newLinks);
                    break;
                default:
                    throw Error();
            }
            
        };

        search_box.addEventListener("keydown", function (e) {
            if (e.code === 'Enter' && search_box.value != null && search_box.value != "") {
                highlightNodes(e, search_box.value, search_input.value);
            }
            else if (e.code === 'Enter'  && search_box.value == "") {
                d3.selectAll('circle').attr('class', null);
            }
        });
        var clear_button = document.getElementById('clear_button');
        clear_button.addEventListener('click', function (e) {
            document.getElementById('search_input').value = '';
            clear_svg();
            newSVG(nodes, links);
        })
    });
});
    


