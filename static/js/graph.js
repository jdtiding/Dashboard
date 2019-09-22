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
    //7-3 yrs_service to be changed to integer:
    d.yrs_service = parseInt(d["yrs.service"]);
  });
  // step 2 - add discipline selector next to the graph:
  show_discipline_selector(ndx);

  // step 6-1 for all genders women and men later see last video for more explanation
  show_percent_that_are_professors(ndx, "Female", "#percent-of-women-professors");
  show_percent_that_are_professors(ndx, "Male", "#percent-of-men-professors");

  // step 2 we pass our variable from ndx to function that is
  // going to draw a graph, call it whatever you like:
  show_gender_balance(ndx);

  // step 3 call function average salary:
  show_average_salary(ndx);

  // step 5-1 show rank distribution:
  show_rank_distribution(ndx);

  // step 7-1
  show_service_to_salary_correlation(ndx);

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

// step 6-2
function show_percent_that_are_professors(ndx, gender, element) {
  var percentageThatAreProf = ndx.groupAll().reduce(
    function (p, v) {
      if (v.sex === gender) {
        p.count++;
        if (v.rank === "Prof") {
          p.are_prof++;
        }
      }
      return p;
    },
    function (p, v) {
      if (v.sex === gender) {
        p.count--;
        if (v.rank === "Prof") {
          p.are_prof--;
        }
      }
      return p;
    },
    function () {
      return { count: 0, are_prof: 0 };
    }
  );
  dc.numberDisplay(element)
    .formatNumber(d3.format(".2%"))
    .valueAccessor(function (d) {
      if (d.count == 0) {
        return 0;
      } else {
        return (d.are_prof / d.count);
      }
    })
    .group(percentageThatAreProf);
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
// step 5-2 create function rank-distribution:
function show_rank_distribution(ndx) {

  var dim = ndx.dimension(dc.pluck('sex'));

  // step 5-3 the group is the place when the things are getting tricky
  //what percentage of men are professors, assistant professor and asociate professor

  // custom reducer written specifically for professors:
  var profByGender = dim.group().reduce(
    function (p, v) {
      p.total++;
      if (v.rank == "Prof") {
        p.match++;
      }
      return p;
    },
    function (p, v) {
      p.total--;
      if (v.rank == "Prof") {
        p.match--;
      }
      return p;
    },
    function () {
      return { total: 0, match: 0 };
    }
  );


  // 5-5 let's create the function rank_by_gender:
  function rankByGender(dimension, rank) {
    //as return we copy profByGender from 5-3 and replace Prof with rank variable
    // and dim is dimension:
    return dimension.group().reduce(
      function (p, v) {
        p.total++;
        if (v.rank == rank) {
          p.match++;
        }
        return p;
      },
      function (p, v) {
        p.total--;
        if (v.rank == rank) {
          p.match--;
        }
        return p;
      },
      function () {
        return { total: 0, match: 0 };
      }
    );
  }

  // 5-4 we can do the same as above IN 5-3 for assistant professor and we'll have basically the same code
  //but the code is so similar that it's a better way to deal with it.
  // instead of duplicating all the data, let's create a function rank_by_gender see above 5-5:

  var professor = rankByGender(dim, "Prof");
  var asstProfByGender = rankByGender(dim, "AsstProf");
  var assocProfByGender = rankByGender(dim, "AssocProf");

  //console.log(profByGender.all());

  dc.barChart("#rank-distribution")
    .width(400)
    .height(300)
    // var dim is set in a normal way
    .dimension(dim)
    // main group prof group and we stack assitant and associate prof on it:
    .group(profByGender, "Prof")
    .stack(asstProfByGender, "Asst Prof")
    .stack(assocProfByGender, "Assoc Prof")

    // because we use reduce function we have to use valueAccessor and indicate
    //which value we want to see
    .valueAccessor(function (d) {
      if (d.value.total > 0) {
        return (d.value.match / d.value.total) * 100;
      }
      else {
        return 0;
      }
    })
    // animation
    .transitionDuration(500)
    // ordinal scale because we don't have numbers only male or female;
    .x(d3.scale.ordinal())
    .xUnits(dc.units.ordinal)
    .legend(dc.legend().x(320).y(20).itemHeight(15).gap(5))
    .margins({ top: 10, right: 100, bottom: 30, left: 50 })

    .xAxisLabel("Gender")
    .yAxis().ticks(4);
}

// step 7-2 create function
function show_service_to_salary_correlation(ndx) {

  // 7-4-1 colors: we need to pick one of the attributes in our data
  //set and map the values in that attribute to the colors that we want
  // we choose gender: 
  var genderColors = d3.scale.ordinal()
    .domain(["Female", "Male"])
    .range(["pink", "blue"]);

  // 7-2 we have to create 2 dimensions
  //first years of service x- axis(min and max years of service)
  var eDim = ndx.dimension(dc.pluck("yrs_service"));
  // second dim function containg 2 pieces of information to plot the dots
  // yrs.service x-coordinate, salary y-coordinate
  var experienceDim = ndx.dimension(function (d) {
    //7-4-2 we have to add the value to pick the color
    // we are adding two here rank and sex
    //but we need only sex - see video explanation
    return [d.yrs_service, d.salary, d.rank, d.sex];
  });
  //creating a group:
  var experienceSalaryGroup = experienceDim.group();

  //creating dots on a scatter plot:
  var minExperience = eDim.bottom(1)[0].yrs_service;
  var maxExperience = eDim.top(1)[0].yrs_service;

  //create scatter plot:
  dc.scatterPlot("#service-salary")
    .width(800)
    .height(400)
    .x(d3.scale.linear().domain([minExperience, maxExperience]))
    //play with brushOn false/true to see what happens with the graph:
    .brushOn(false)
    //size of the dots:
    .symbolSize(8)
    //leaves room at the top
    .clipPadding(10)
    .yAxisLabel("Years Of Service")
    //what will appear if you hover the mouse over the dot:
    .title(function (d) {
      //d.key[1] see varexpericneDim = d.salary
      //7-4-4 we allso modify titel and adding rank
      return d.key[2] + " earned" + d.key[1];
    })
    //7-4-4 we need to add color accessor from var experienceDim
    // sex is array 3
    .colorAccessor(function(d) {
      return d.key[3];
    })
    //7-4-2 adding colors from 7-4-1 to our graph:
    .colors(genderColors)
    .dimension(experienceDim)
    .group(experienceSalaryGroup)
    .margins({ top: 10, right: 50, bottom: 75, left: 75 });

}

