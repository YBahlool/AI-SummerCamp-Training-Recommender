import { addToCart } from './cart.js';

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
              <button class="action-btn" data-course-code="${courseCode}">Add to Cart</button>
              <span class="trash-btn">🗑️</span>
            </td>
          `;
          
          // Add event listener to the Add to Cart button
          const addButton = row.querySelector('.action-btn');
          addButton.addEventListener('click', function() {
            addToCart(courseCode);
          });
          
          tableBody.appendChild(row);
        }
      });
    })
    .catch((error) => {
      console.error("Failed to load course data:", error);
    });
});