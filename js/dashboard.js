document.addEventListener("DOMContentLoaded", () => {
  // Load training list
  const trainings = JSON.parse(localStorage.getItem("trainingList")) || [
    "Lab Electrical Safety",
    "Soldering Safety",
    "General Chemical Handling"
  ];

  const list = document.getElementById("training-list");
  trainings.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });

  // Sidebar toggle for Enrollment
  const enrollmentToggle = document.getElementById("enrollment-toggle");
  const enrollmentSubmenu = document.getElementById("enrollment-submenu");

  enrollmentToggle.addEventListener("click", () => {
    const isVisible = enrollmentSubmenu.style.display === "flex";
    enrollmentSubmenu.style.display = isVisible ? "none" : "flex";
  });
});
