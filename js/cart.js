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

// Load cart data from API
export async function loadCourseData() {
  try {
    const response = await fetch('http://localhost:3000/api/courseData');
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
    console.error('Failed to load course data from API:', error);
    return {};
  }
}

