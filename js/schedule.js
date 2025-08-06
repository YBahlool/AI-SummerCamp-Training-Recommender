document.addEventListener("DOMContentLoaded", function () {
  fetch("data/course_info.json")
    .then((response) => response.json())
    .then((departments) => {
      const tableBody = document.querySelector("#courseTableBody");

      departments.forEach((deptObj) => {
        const deptName = Object.keys(deptObj)[0];
        const courseEntries = deptObj[deptName].courses;

        for (const courseCode in courseEntries) {
          const course = courseEntries[courseCode];

          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${course.name}</td>
            <td>${course.units}</td>
            <td>✔️</td>
            <td>
              <button class="btn btn-green">Select Sections</button>
              <span class="trash-icon">🗑️</span>
            </td>
          `;
          tableBody.appendChild(row);
        }
      });
    })
    .catch((error) => {
      console.error("Failed to load course data:", error);
    });
});
