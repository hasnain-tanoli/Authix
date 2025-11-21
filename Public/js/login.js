redirectIfAuth();

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  loginUser(email, pass);
});
