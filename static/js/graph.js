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
  // crossfilter ,one for the whole dashboard
  var ndx = crossfilter(salaryData);

  //step 4 we can't see anytghing on the graph because our data are strings
  // change them for integers:
  salaryData.forEach(function (d) {
    d.salary = parseInt(d.salary);
  })
    // step 2 - add discipline selector next to the graph:
    show_discipline_selector(ndx);

    // we pass our variable from ndx to function that is
    // going to draw a graph, call it whatever you like:
    show_gender_balance(ndx);

    // step 3 call function average salary:
    show_average_salary(ndx);

    dc.renderAll();
  }
// step 2 above show_gender_balance we add discipline-selector function:
function show_discipline_selector(ndx) {
      dim = ndx.dimension(dc.pluck('discipline'));
      group = dim.group();

      dc.selectMenu("#discipline-selector")
        .dimension(dim)
        .group(group);
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

        //step 2 deletedd because graphs do not move with changes to y axis:
        //.elasticY(true)

        .xAxisLabel("Gender")
        .yAxis().ticks(20);
    }
// step 3 create function for average salary:
function show_average_salary(ndx) {
      var dim = ndx.dimension(dc.pluck('sex'));

      function add_item(p, v) {
        p.count++;
        p.total += v.salary;
        p.average = p.total / p.count;
        return p;
      }

      function remove_item(p, v) {
        p.count--;
        if (p.count == 0) {
          p.total = 0;
          p.average = 0;
        } else {
          p.total -= v.salary;
          p.average = p.total / p.count;
        }
        return p;
      }

      function initialise() {
        return { count: 0, total: 0, average: 0 };
      }

      var averageSalaryByGender = dim.group().reduce(add_item, remove_item, initialise);

      // step 4 plot barchart:

      dc.barChart("#average-salary")
        .width(400)
        .height(300)
        .margins({ top: 10, right: 50, bottom: 30, left: 50 })
        // var dim
        .dimension(dim)
        // var averageSalaryByGender is our group
        .group(averageSalaryByGender)

        // because we use reduce function we have to use valueAccessor and indicate
        //which value we want to see, in this case average (function initialise)
        //add toFixed(2) to reduce number of decimals:
        .valueAccessor(function (d) {
          return d.value.average.toFixed(2);
        })
        // animation
        .transitionDuration(500)
        // ordinal scale because we don't have numbers only male or female;
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)

        .elasticY(true)

        .xAxisLabel("Gender")
        .yAxis().ticks(4);

    }