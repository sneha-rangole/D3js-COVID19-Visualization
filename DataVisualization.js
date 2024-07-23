// Load data from CSV file and draw the visualization
function drawVisualization() {
    // Variable to store the interval for blinking
    let activeBlinkInterval; 

    // Load data from covid_19_cases CSV file
    d3.csv("covid_19_cases.csv").then(function(data) {
        // Draw the World map
        d3.json("https://gist.githubusercontent.com/d3indepth/f28e1c3a99ea6d84986f35ac8646fac7/raw/c58cede8dab4673c91a3db702d50f7447b373d98/ne_110m_land.json")
            .then(function(json) {
                const geojson = json;

                // Visualization code for Map
                const margin = { top: 20, right: 20, bottom: 20, left: 20 };
                const width = 800;
                const height = 600 - margin.top - margin.bottom;

                const svg = d3.select("#map-visualization")
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .call(d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed));

                const g = svg.append("g");

                const projection = d3.geoMercator()
                    .scale(170)
                    .translate([width / 2, height / 2]);

                const path = d3.geoPath().projection(projection);

                // Draw the map background
                g.selectAll("path")
                    .data(geojson.features)
                    .enter().append("path")
                    .attr("d", path)
                    .style("fill", "#F5F5F5") // Fill color of the map
                    .style("stroke", "#000000"); // Border color of the map

                // Function to draw the bar chart visualization
            function drawBarChart(data) {
                    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
                    const width = 800 - margin.left - margin.right;
                    const height = 400 - margin.top - margin.bottom;

                    // Function for Bar visualization
                const svg = d3.select("#bar-visualization")
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom);

                const g = svg.append("g")
                    .attr("transform", `translate(${margin.left},${margin.top})`);

                const x = d3.scaleBand()
                    .range([0, width])
                    .padding(0.1);

                const y = d3.scaleLinear()
                    .range([height, 0]);

                const xAxis = d3.axisBottom(x);
                const yAxis = d3.axisLeft(y).ticks(20);;

                // Initial update
                update("Active");

                // Function to update bar chart based on selected filter
                function update(filter) {
                // Update x scale domain
                x.domain(data.map(d => d["WHO Region"]));
                
                // Update y scale domain
                y.domain([0, d3.max(data, d => d[filter])]);
                
                // Remove existing bars
                g.selectAll(".bar").remove();
                
                // Append new bars
                g.selectAll(".bar")
                    .data(data)
                    .enter().append("rect")
                    .attr("class", "bar")
                    .attr("x", d => x(d["WHO Region"]))
                    .attr("y", d => y(d[filter]))
                    .attr("width", x.bandwidth())
                    .attr("height", d => height - y(d[filter]))
                    .attr("fill", function(d) {
                        switch(filter) {
                            case 'Deaths':
                                return "red"; // Color for death cases
                            case 'Confirmed':
                                return "blue"; // Color for confirmed cases
                            case 'Recovered':
                                return "green"; // Color for recovered cases
                            default:
                                return "orange"; // Color for active cases
                        }
                    });

                // Update x-axis
                g.append("g")
                    .attr("class", "x axis")
                    .attr("transform", `translate(0,${height})`)
                    .call(xAxis);

                // Update y-axis
                g.append("g")
                    .attr("class", "y axis")
                    .call(yAxis);
                }

                // Dropdown change event listener
                d3.select("#filter").on("change", function() {
                    const selectedFilter = this.value;
                    update(selectedFilter);
                    d3.select("#map-visualization .chart-title").text(`COVID-19 Cases Worldwide (${selectedFilter})`);
                    d3.select("#bar-visualization .chart-title").text(`COVID-19 Cases by WHO Region (${selectedFilter})`);
                    // Call function to update map visualization with the same filter
                    updateVisualization(selectedFilter);
                });
            }

            // Function to update visualization based on selected filter
            function updateVisualization(filter) {

            // Filter data based on the selected filter
            let filteredData = data.filter(d => d[filter] > 5000);

            // Remove existing circles
            g.selectAll(".coordinate").remove();
            // Draw coordinate geometry for the filtered data
            const circles = g.selectAll(".coordinate")
                .data(filteredData)
                .enter().append("circle")
                .attr("class", "coordinate")
                .attr("cx", d => projection([d.Long, d.Lat])[0])
                .attr("cy", d => projection([d.Long, d.Lat])[1])
                .attr("r", d => {
                    // Calculate size based on Confirmed, Active, etc.
                    return Math.sqrt(d[filter]) / 100; // Simplified scaling for demonstration
                })
                .style("fill", function(d) {
                    switch(filter) {
                        case 'Deaths':
                            return "red"; // Color for death cases
                        case 'Confirmed':
                            return "blue"; // Color for confirmed cases
                        case 'Recovered':
                            return "green"; // Color for recovered cases
                        default:
                            return "orange"; // Color for active cases
                    }
                })
                .on("mouseover", function() {
                    // Stop blinking on mouseover
                    clearInterval(activeBlinkInterval); 
                    // Increase size on mouseover
                    d3.select(this).transition().attr("r", d => Math.sqrt(d[filter]) / 100 + 3); 
                    tooltip.style("opacity", 1).html(`${d3.select(this).datum()["Country/Region"]}: ${d3.select(this).datum()[filter]}`)
                        .style("left", (d3.event.pageX + 10) + "px")
                        .style("top", (d3.event.pageY - 20) + "px");
                })
                .on("mouseout", function() {
                    // Resume blinking when mouse leaves the circle
                    activeBlinkInterval = startBlinking(circles.filter(d => d.Active > 5000));
                    // Restore size on mouseout
                    d3.select(this).transition().attr("r", d => Math.sqrt(d[filter]) / 100); 
                    tooltip.style("opacity", 0);
                });
            }

            // Initial call to draw bar chart
            drawBarChart(data);

            // Initial visualization with "Active" filter
            updateVisualization("Active");

            function zoomed() {
                g.attr("transform", d3.event.transform);
            }

            // Create a tooltip
            const tooltip = d3.select("#map-visualization").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

            })
            .catch(function(error) {
                // Handle error if JSON file loading fails
                console.log("Error loading the JSON file:", error);
            });
    }).catch(function(error) {
        // Handle error if CSV file loading fails
        console.log("Error loading the CSV file:", error);
    });
}

// Call the function to draw the visualization
drawVisualization();