queue()
  .defer(d3.csv, "data/Salaries.csv")
  .await(makeGraphs);
// make function see below don't put anything between curly brackets;
// developer/sources add break point on line 7 and reaload the page and in console
// you can make a check:
// var ndx = crossfilter(salaryData);
// undefined
// var dim = ndx.dimension(dc.pluck('rank'));
// undefined
// var group = dim.group();
// undefined
// group.all();
// (3) [{…}, {…}, {…}]
// 0: {key: "AssocProf", value: 64}
// 1: {key: "AsstProf", value: 67}
// 2: {key: "Prof", value: 266}
// length: 3
// __proto__: Array(0)

// we have 3 different ranks and we can see the number of rows in each rank;
// so our data is loading correctly.

function makeGraphs(error, salaryData) {
  // crossfilter , one for the whole dashboard
  var ndx = crossfilter(salaryData);

  // we pass our variable from ndx to function that is
  // going to draw a graph, call it whatever you like:
  show_gender_balance(ndx);

  dc.renderAll();
}

// create function:
function show_gender_balance(ndx) {
  var dim = ndx.dimension(dc.pluck('sex'));
  var group = dim.group();

  //gender-balance will be rendered;
  dc.barChart("#gender-balance")
    .width(400)
    .height(300)
    .margins({ top: 10, right: 50, bottom: 30, left: 50 })
    // var dim
    .dimension(dim)
    // var group
    .group(group)
    // animation
    .transitionDuration(500)
    // ordinal scale because we don't have numbers;
    .x(d3.scale.ordinal())
    .xUnits(dc.units.ordinal)
    .elasticY(true)
    .xAxisLabel("Gender")
    .yAxis().ticks(20);
}