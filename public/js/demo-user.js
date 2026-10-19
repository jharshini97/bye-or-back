// Shared demo-user selector for Bye or Back.
// This is a UI demonstration, NOT real authentication or authorization.

const STORAGE_KEY = "demoUser";
const DEMO_USERS = ["Priya", "Lucy", "Tom", "Ben"];
const USER_CHANGED_EVENT = "demo-user-changed";

export function getCurrentUser() {
  const savedUser = sessionStorage.getItem(STORAGE_KEY);
  return DEMO_USERS.includes(savedUser) ? savedUser : null;
}

// Subscribe to user changes made on the current page.
// Returns a function that removes the listener, if needed.
export function onDemoUserChange(callback) {
  const handler = (event) => callback(event.detail.user);
  window.addEventListener(USER_CHANGED_EVENT, handler);
  return () => window.removeEventListener(USER_CHANGED_EVENT, handler);
}

// Add <div id="demo-user-container"></div> inside a page's header,
// then call initDemoUser() after the page has loaded.
export function initDemoUser() {
  const mount = document.querySelector("#demo-user-container");

  if (!mount) {
    throw new Error(
      'Missing <div id="demo-user-container"></div> in the header.',
    );
  }

  // Avoid duplicate menus and listeners if initialized twice.
  if (mount.querySelector(".user-menu")) {
    return;
  }

  // Generate shared markup for every page.
  mount.innerHTML = `
     <details class="user-menu">
       <summary aria-label="Choose demo user" title="Choose demo user">
         <svg width="24" height="24" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2"
              aria-hidden="true">
           <circle cx="12" cy="8" r="4"></circle>
           <path d="M4 21a8 8 0 0 1 16 0"></path>
         </svg>
         <span class="user-menu-name"></span>
       </summary>

       <div class="user-menu-panel">
         <form class="demo-login-form">
           <label for="demo-user">Choose user</label>
           <select id="demo-user" name="demoUser">
             <option value="">No user</option>
             <option value="Priya">Priya</option>
             <option value="Lucy">Lucy</option>
             <option value="Tom">Tom</option>
             <option value="Ben">Ben</option>
           </select>

           <label for="demo-password">Password</label>
           <input
             type="password"
             id="demo-password"
             placeholder="Enter password"
             autocomplete="off"
           >

           <button type="submit">Login</button>
           <p>Demo only — no real authentication</p>
         </form>
       </div>
     </details>
   `;

  const menu = mount.querySelector(".user-menu");
  const summary = mount.querySelector(".user-menu summary");
  const nameLabel = mount.querySelector(".user-menu-name");
  const form = mount.querySelector(".demo-login-form");
  const userSelect = mount.querySelector("#demo-user");
  const passwordInput = mount.querySelector("#demo-password");

  const renderName = (user) => {
    nameLabel.textContent = user ?? "";
    summary.setAttribute(
      "aria-label",
      user ? `Signed in as ${user}` : "Choose demo user",
    );
    summary.setAttribute(
      "title",
      user ? `Signed in as ${user}` : "Choose demo user",
    );
  };

  userSelect.value = getCurrentUser() ?? "";
  renderName(getCurrentUser());

  passwordInput.addEventListener("input", () => {
    passwordInput.setCustomValidity("");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const selectedUser = DEMO_USERS.includes(userSelect.value)
      ? userSelect.value
      : null;

    if (selectedUser && passwordInput.value.trim() === "") {
      passwordInput.setCustomValidity("Please enter a password");
      passwordInput.reportValidity();
      return;
    }

    passwordInput.setCustomValidity("");

    if (selectedUser) {
      sessionStorage.setItem(STORAGE_KEY, selectedUser);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }

    renderName(selectedUser);

    // Never store or transmit the demo password.
    passwordInput.value = "";
    menu.open = false;

    window.dispatchEvent(
      new CustomEvent(USER_CHANGED_EVENT, {
        detail: { user: selectedUser },
      }),
    );

    window.alert(
      selectedUser
        ? `Now you are: ${selectedUser}`
        : "You are now browsing without a user",
    );
  });
}
