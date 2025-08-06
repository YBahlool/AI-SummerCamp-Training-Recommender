// Cart functionality
export function getCart() {
  return JSON.parse(localStorage.getItem('cart')) || [];
}

export function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

export function addToCart(courseCode) {
  const cart = getCart();
  if (!cart.includes(courseCode)) {
    cart.push(courseCode);
    saveCart(cart);
    showToast(`${courseCode} added to cart!`);
    refreshTrainingRequirements();
    return true;
  }
  showToast(`${courseCode} is already in cart`);
  return false;
}

export function removeFromCart(courseCode) {
  const cart = getCart();
  const index = cart.indexOf(courseCode);
  if (index > -1) {
    cart.splice(index, 1);
    saveCart(cart);
    refreshTrainingRequirements();
    return true;
  }
  return false;
}

function showToast(message) {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Load cart data from course_info.json
export async function loadCourseData() {
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
    
    return courseMap;
  } catch (error) {
    console.error('Failed to load course data:', error);
    return {};
  }
}

async function refreshTrainingRequirements() {
  const cart = getCart();
  const list = document.getElementById("training-list");
  const badge = document.getElementById("training-badge");
  
  if (!list) return; // Not on dashboard page
  
  if (cart.length === 0) {
    list.innerHTML = '<li>Add courses to your cart to see required trainings</li>';
    if (badge) badge.style.display = 'none';
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
    if (badge) {
      badge.textContent = data.trainings.length;
      badge.style.display = data.trainings.length > 0 ? 'inline' : 'none';
    }
  } catch (error) {
    console.error('Failed to refresh training requirements:', error);
  }
}