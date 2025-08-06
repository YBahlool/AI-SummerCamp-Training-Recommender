document.addEventListener("DOMContentLoaded", async () => {
  // Load training requirements from API
  await loadTrainingRequirements();

  // Load and display cart items
  await loadCartSummary();

  // Sidebar toggle for Enrollment
  const enrollmentToggle = document.getElementById("enrollment-toggle");
  const enrollmentSubmenu = document.getElementById("enrollment-submenu");

  enrollmentToggle.addEventListener("click", () => {
    const isVisible = enrollmentSubmenu.style.display === "flex";
    enrollmentSubmenu.style.display = isVisible ? "none" : "flex";
  });
});

async function loadTrainingRequirements() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const list = document.getElementById("training-list");
  const badge = document.getElementById("training-badge");
  
  if (cart.length === 0) {
    list.innerHTML = '<li>Add courses to your cart to see required trainings</li>';
    badge.style.display = 'none';
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/getRequiredTrainings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courses: cart })
    });
    
    const data = await response.json();
    
    list.innerHTML = '';
    data.trainings.forEach(training => {
      const li = document.createElement('li');
      li.textContent = training;
      list.appendChild(li);
    });
    
    // Update badge with training count
    badge.textContent = data.trainings.length;
    badge.style.display = data.trainings.length > 0 ? 'inline' : 'none';
  } catch (error) {
    console.error('Failed to load training requirements:', error);
    list.innerHTML = '<li>Unable to load training requirements</li>';
    badge.style.display = 'none';
  }
}

async function loadCartSummary() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const cartSummary = document.getElementById('cart-summary');
  const cartList = document.getElementById('cart-list');
  const cartActions = document.getElementById('cart-actions');

  if (cart.length === 0) {
    cartSummary.style.display = 'block';
    cartList.style.display = 'none';
    cartActions.style.display = 'none';
    return;
  }

  // Load course data to get course names
  try {
    const response = await fetch('data/course_info.json');
    const departments = await response.json();
    
    const courseMap = {};
    departments.forEach(deptObj => {
      const deptName = Object.keys(deptObj)[0];
      const courses = deptObj[deptName].courses;
      
      for (const courseCode in courses) {
        courseMap[courseCode] = courses[courseCode];
      }
    });

    // Display cart items
    cartSummary.style.display = 'none';
    cartList.style.display = 'block';
    cartActions.style.display = 'block';
    cartList.innerHTML = '';

    cart.slice(0, 3).forEach(courseCode => {
      const course = courseMap[courseCode];
      if (course) {
        const li = document.createElement('li');
        li.textContent = course.name;
        li.style.marginBottom = '0.3rem';
        cartList.appendChild(li);
      }
    });

    if (cart.length > 3) {
      const li = document.createElement('li');
      li.innerHTML = `<em>View ${cart.length - 3} More</em>`;
      li.style.marginBottom = '0.3rem';
      cartList.appendChild(li);
    }

  } catch (error) {
    console.error('Failed to load course data:', error);
  }
}
