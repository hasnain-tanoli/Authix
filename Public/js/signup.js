redirectIfAuth();

document.getElementById("signupForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const user = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  signupUser(name, user, email, pass);
});
