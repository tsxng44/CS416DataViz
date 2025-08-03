let data = [];
let currentSlide = 1;
const maxSlide = 5;

let minScore = 0;
let filters = {
  gender: "all",
  parentEdu: "all",
  lunch: "all",
  prep: "all"
};

d3.csv("data/StudentsPerformance.csv").then(raw => {
  raw.forEach(d => {
    d.math = +d["math score"];
    d.reading = +d["reading score"];
    d.writing = +d["writing score"];
  });

  data = raw;
  populateParentEduOptions();
  addEventListeners();
  renderSlide(currentSlide);
});

function populateParentEduOptions() {
  const parentEduList = [
    "associate's degree",
    "bachelor's degree",
    "high school",
    "master's degree",
    "some college",
    "some high school"
  ];

  const select = d3.select("#parentEdu");
  parentEduList.forEach(level => {
    select.append("option").attr("value", level).text(level);
  });
}

function addEventListeners() {
  d3.select("#minScore").on("input", function () {
    minScore = +this.value;
    d3.select("#scoreValue").text(minScore);
    if (currentSlide >= 3) renderSlide(currentSlide);
  });

  ["gender", "parentEdu", "lunch", "prep"].forEach(id => {
    d3.select(`#${id}`).on("change", function () {
      filters[id] = this.value;
      if (currentSlide >= 3) renderSlide(currentSlide);
    });
  });
}

function prevSlide() {
  if (currentSlide > 1) {
    currentSlide--;
    renderSlide(currentSlide);
  }
}

function nextSlide() {
  if (currentSlide < maxSlide) {
    currentSlide++;
    renderSlide(currentSlide);
  }
}

function renderSlide(n) {
  const svg = d3.select("#chart");
  svg.selectAll("*").remove();
  d3.select("#slideContent").html("");
  const showInteractive = n >= 3;

  d3.select("#controls").style("display", showInteractive ? "block" : "none");
  d3.select("svg").style("display", showInteractive ? "block" : "none");

  if (n === 1) {
    d3.select("#slideContent").html(`<h2>CS416: Data Visualization Project </h2>
      <h3>Andrew Tseng</h3>
      <p>Let's explore how different factors such as gender, education, lunch plan, and test prep influence exam scores.</p>
      <img src="assets/clipart2575261.png" alt="Student Performance" style="max-width: 400px; margin: 20px auto; display: block;">`);
  } else if (n === 2) {
    d3.select("#slideContent").html(`<h2>About This Visualization</h2>
      <p>This interactive narrative walks through three key academic subjects: Math, Reading, and Writing.
      Use the dropdowns and slider to filter by gender, parental education, lunch status, and test prep completion.
      Let’s explore how these factors shape performance.</p>
      <img src="assets/slide2.png" alt="Study Concept" style="max-width: 400px; margin: 20px auto; display: block;">
  `);
  } else if (n === 3) {
    drawBarChart("math", "Math");
    d3.select("#slideContent").html(`
    <h2>Math Score Insights Based on Data</h2>
    <p><strong>Annotation:</strong> Male students have a noticable edge in math, averaging about 5 points higher than female students.
    This difference may be due to societal encouragement of males in STEM fields. This may be a pattern worth examining when addressing gender equity in education.</p>
    <p><strong>Impact:</strong> Highlights a potential social stereotype regarding gender and math ability.</p>
    <p><strong>Raw Averages:</strong> Male avg = 68.7 vs. Female avg = 63.6</p>

    <p><em>Feel free to use the dropdown menu to filter the chart below.</em></p>
  `);
  } else if (n === 4) {
    drawBarChart("reading", "Reading");
     d3.select("#slideContent").html(`
    <h2>Reading Score Insights Based on Data</h2>
    <p><strong>Annotation:</strong> Female students generally outperform males in reading by over 7 points on average.
    This gap may suggests stronger early literacy development, possibly influenced by learning environments or parental/societal expectations.</p>
    <p><strong>Impact:</strong> Reading proficiency is linked to various academic successes across different disciplines.</p>
    <p><strong>Raw Averages:</strong> Female avg = 72.6 vs. Male avg = 65.5</p>

    <p><em>Feel free to use the dropdown menu to filter the chart below.</em></p>
  `);
  } else if (n === 5) {
    drawBarChart("writing", "Writing");
    d3.select("#slideContent").html(`
    <h2>Writing Score Insights Based on Data</h2>
    <p><strong>Annotation:</strong> In general, writing shows the largest gap in performance between genders, with female students scoring on average 9 points higher than males.
    This may point to a combination of factors, including communication skills, classroom support, societal expectations, and more.</p>
    <p><strong>Impact:</strong> Writing skills are crucial for both college readiness and success in a professional field.</p>
    <p><strong>Raw Averages:</strong> Female avg = 72.5 vs. Male avg = 63.3</p>

    <p><em>Feel free to use the dropdown menu to filter the chart below.</em></p>
  `);
  }

  const progressPercent = ((n - 1) / (maxSlide - 1)) * 100;
  d3.select("#progressBar").style("width", `${progressPercent}%`);


}

function filterData(subject) {
  return data.filter(d =>
    d[subject] >= minScore &&
    (filters.gender === "all" || d.gender === filters.gender) &&
    (filters.parentEdu === "all" || d["parental level of education"] === filters.parentEdu) &&
    (filters.lunch === "all" || d.lunch === filters.lunch) &&
    (filters.prep === "all" || d["test preparation course"] === filters.prep)
  );
}

function drawBarChart(subject, label) {
  const svg = d3.select("#chart");
  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const margin = { top: 40, right: 30, bottom: 40, left: 60 };

  const filtered = filterData(subject);

  const grouped = d3.rollups(
    filtered,
    v => d3.mean(v, d => d[subject]),
    d => d.gender
  ).map(([gender, avg]) => ({ gender, avg }));

  const x = d3.scaleBand()
    .domain(grouped.map(d => d.gender))
    .range([margin.left, width - margin.right])
    .padding(0.4);

  const y = d3.scaleLinear()
    .domain([0, d3.max(grouped, d => d.avg)]).nice()
    .range([height - margin.bottom, margin.top]);

  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y));

  svg.selectAll(".bar")
    .data(grouped)
    .enter()
    .append("rect")
    .attr("x", d => x(d.gender))
    .attr("y", d => y(d.avg))
    .attr("width", x.bandwidth())
    .attr("height", d => y(0) - y(d.avg))
    .attr("fill", "steelblue");

  svg.selectAll(".label")
    .data(grouped)
    .enter()
    .append("text")
    .attr("x", d => x(d.gender) + x.bandwidth() / 2)
    .attr("y", d => y(d.avg) - 5)
    .attr("text-anchor", "middle")
    .text(d => d.avg.toFixed(1));

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .attr("font-size", "18px")
    .attr("font-weight", "bold")
    .text(`${label} Score by Gender`);
}

window.nextSlide = nextSlide;
window.prevSlide = prevSlide;
