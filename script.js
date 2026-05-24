const navControls = document.querySelectorAll(".nav-control, .nav-link");
const selectionControls = document.querySelectorAll(".selection-control");
const noActionControls = document.querySelectorAll(".no-action-control");
const orderLaunchControls = document.querySelectorAll(".order-launch");
const authEntries = document.querySelectorAll(".auth-entry");
const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll("[data-section]");
const orderPage = document.querySelector("#orderPage");
const loginModal = document.querySelector(".login-modal");
const loginUser = document.querySelector(".login-user");
const loginPassword = document.querySelector(".login-password");
const loginSubmit = document.querySelector(".login-submit");
const modalClose = document.querySelector(".modal-close");
const checkoutAction = document.querySelector(".checkout-action");
const paymentBox = document.querySelector(".payment-box");
const successPanel = document.querySelector(".success-panel");
const checkoutGrid = document.querySelector(".checkout-grid");
const checkoutNote = document.querySelector(".checkout-note");
const logoutButton = document.querySelector(".logout-button");
const planRows = document.querySelectorAll(".plan-row");
const fuelCards = document.querySelectorAll(".fuel-card");
const miniProducts = document.querySelectorAll(".mini-product");
const miniPlans = document.querySelectorAll(".mini-plan");
const paymentOptions = document.querySelectorAll(".payment-option");
let navLockTimer;
let loginTypingTimer;
let pendingAfterLogin;
let isLoggedIn = false;

const planDetails = {
  "10L": { label: "10L 補給包", price: "$399" },
  "20L": { label: "20L 補給包", price: "$699" },
  "30L": { label: "30L 補給包", price: "$999" },
};

const orderState = {
  product: "Original",
  plan: "20L",
  payment: "cash",
  stage: "select",
};

function findTargetElement(targetName) {
  if (targetName === "home") {
    return document.documentElement;
  }

  return document.getElementById(targetName) || document.querySelector(`[data-section="${targetName}"]`);
}

function scrollToTarget(targetName) {
  const target = findTargetElement(targetName);

  if (!target) {
    return;
  }

  if (target === document.documentElement) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  target.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function setActiveNav(targetName) {
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.target === targetName);
  });
}

function pulseControl(control) {
  control.classList.remove("pulse");
  void control.offsetWidth;
  control.classList.add("pulse");
}

function closeCheckoutPage() {
  document.body.classList.remove("checkout-mode");
  orderPage.setAttribute("aria-hidden", "true");
}

function triggerNavControl(control) {
  const targetName = control.dataset.target;

  pulseControl(control);
  closeCheckoutPage();
  scrollToTarget(targetName);
  setActiveNav(targetName);

  window.clearTimeout(navLockTimer);
  navLockTimer = window.setTimeout(() => {
    navLockTimer = undefined;
  }, 850);
}

function selectControl(control) {
  const groupName = control.dataset.selectGroup;

  pulseControl(control);

  if (groupName) {
    document.querySelectorAll(`.selection-control[data-select-group="${groupName}"]`).forEach((item) => {
      item.classList.toggle("selected", item === control);
    });
  }

  if (control.classList.contains("order-launch")) {
    openCheckoutFromControl(control);
  }
}

function getSelectedPlan() {
  return document.querySelector(".plan-row.selected")?.dataset.plan || orderState.plan;
}

function getSelectedProduct() {
  return document.querySelector(".fuel-card.selected")?.dataset.product || orderState.product;
}

function openCheckoutFromControl(control) {
  openCheckoutPage({
    plan: control.dataset.plan || getSelectedPlan(),
    product: control.dataset.product || getSelectedProduct(),
  });
}

function openCheckoutPage(nextState = {}) {
  orderState.product = nextState.product || orderState.product;
  orderState.plan = nextState.plan || orderState.plan;
  orderState.stage = "select";

  document.body.classList.add("checkout-mode");
  orderPage.setAttribute("aria-hidden", "false");
  setActiveNav(nextState.product ? "products" : "plan");
  syncSelectedCards();
  renderCheckout();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateAuthUI() {
  authEntries.forEach((entry) => {
    entry.classList.toggle("logged-in", isLoggedIn);

    if (entry.classList.contains("join-button")) {
      entry.innerHTML = isLoggedIn ? "Hi, piyan" : 'Join Party <span class="party-mark" aria-hidden="true"></span>';
    } else if (entry.classList.contains("login-chip")) {
      entry.innerHTML = isLoggedIn
        ? '<span class="login-dot" aria-hidden="true"></span> piyan 已登入'
        : '<span class="login-dot" aria-hidden="true"></span> 未登入';
    }
  });

  logoutButton.hidden = !isLoggedIn;
}

function openLogin(afterLogin) {
  pendingAfterLogin = afterLogin;
  loginModal.setAttribute("aria-hidden", "false");
  loginUser.value = "";
  loginPassword.value = "";
  loginSubmit.disabled = true;

  window.clearTimeout(loginTypingTimer);
  animateLoginField(loginUser, "piyan", () => {
    animateLoginField(loginPassword, "******", () => {
      loginSubmit.disabled = false;
      loginSubmit.focus();
    });
  });
}

function closeLogin() {
  loginModal.setAttribute("aria-hidden", "true");
  window.clearTimeout(loginTypingTimer);
}

function animateLoginField(field, value, done) {
  let index = 0;
  field.focus();

  function typeNext() {
    field.value = value.slice(0, index);
    index += 1;

    if (index <= value.length + 1) {
      loginTypingTimer = window.setTimeout(typeNext, 80);
      return;
    }

    done();
  }

  typeNext();
}

function finishLogin() {
  isLoggedIn = true;
  closeLogin();
  updateAuthUI();

  if (pendingAfterLogin) {
    const action = pendingAfterLogin;
    pendingAfterLogin = undefined;
    action();
  }
}

function syncSelectedCards() {
  planRows.forEach((row) => {
    row.classList.toggle("selected", row.dataset.plan === orderState.plan);
  });

  fuelCards.forEach((card) => {
    card.classList.toggle("selected", card.dataset.product === orderState.product);
  });

  miniProducts.forEach((card) => {
    card.classList.toggle("active", card.dataset.product === orderState.product);
  });

  miniPlans.forEach((card) => {
    card.classList.toggle("active", card.dataset.plan === orderState.plan);
  });

  paymentOptions.forEach((option) => {
    option.classList.toggle("active", option.dataset.payment === orderState.payment);
  });
}

function renderCheckout() {
  const plan = planDetails[orderState.plan];
  const planText = `${orderState.plan} / ${plan.price}`;
  const orderTitle = `${orderState.product} ${plan.label}`;

  document.querySelectorAll(".summary-product").forEach((item) => {
    item.textContent = orderState.product;
  });

  document.querySelectorAll(".summary-plan").forEach((item) => {
    item.textContent = planText;
  });

  document.querySelector(".order-title").textContent = orderTitle;

  document.querySelectorAll(".step").forEach((step) => {
    step.classList.toggle("active", step.dataset.step === orderState.stage);
  });

  paymentBox.hidden = orderState.stage !== "payment";
  successPanel.hidden = orderState.stage !== "success";
  checkoutGrid.hidden = orderState.stage === "success";

  if (orderState.stage === "select") {
    checkoutAction.textContent = "下定訂單";
    checkoutNote.textContent = isLoggedIn ? "會員已登入，可以直接建立訂單。" : "欲購買請先登入會員。";
  }

  if (orderState.stage === "order") {
    checkoutAction.textContent = "確認訂購";
    checkoutNote.textContent = "訂單已建立，確認後進入付款方式。";
  }

  if (orderState.stage === "payment") {
    checkoutAction.textContent = "完成付款";
    checkoutNote.textContent = "選擇現金、線上支付或派對點數付款。";
  }

  if (orderState.stage === "success") {
    document.querySelector(".success-copy").textContent =
      `訂單 HF-2026 已成立，${orderState.product} ${plan.label} 將以 ${getPaymentLabel()} 完成補給。`;
  }
}

function setCheckoutStage(stage) {
  orderState.stage = stage;
  renderCheckout();
}

function getPaymentLabel() {
  return {
    cash: "現金",
    online: "線上支付",
    party: "派對點數",
  }[orderState.payment];
}

function handleCheckoutAction() {
  if (orderState.stage === "select") {
    if (!isLoggedIn) {
      openLogin(() => setCheckoutStage("order"));
      return;
    }

    setCheckoutStage("order");
    return;
  }

  if (orderState.stage === "order") {
    setCheckoutStage("payment");
    return;
  }

  if (orderState.stage === "payment") {
    setCheckoutStage("success");
  }
}

navControls.forEach((control) => {
  control.addEventListener("click", () => triggerNavControl(control));
});

selectionControls.forEach((control) => {
  control.addEventListener("click", () => selectControl(control));

  if (control.tagName !== "BUTTON") {
    control.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectControl(control);
      }
    });
  }
});

orderLaunchControls.forEach((control) => {
  if (!control.classList.contains("selection-control")) {
    control.addEventListener("click", () => {
      pulseControl(control);
      openCheckoutFromControl(control);
    });
  }
});

noActionControls.forEach((control) => {
  control.addEventListener("click", () => pulseControl(control));
});

authEntries.forEach((control) => {
  control.addEventListener("click", () => {
    pulseControl(control);

    if (isLoggedIn) {
      openCheckoutPage();
      return;
    }

    openLogin(() => openCheckoutPage());
  });
});

logoutButton.addEventListener("click", () => {
  isLoggedIn = false;
  pendingAfterLogin = undefined;
  updateAuthUI();
  renderCheckout();
});

miniProducts.forEach((button) => {
  button.addEventListener("click", () => {
    orderState.product = button.dataset.product;
    orderState.stage = "select";
    syncSelectedCards();
    renderCheckout();
  });
});

miniPlans.forEach((button) => {
  button.addEventListener("click", () => {
    orderState.plan = button.dataset.plan;
    orderState.stage = "select";
    syncSelectedCards();
    renderCheckout();
  });
});

paymentOptions.forEach((button) => {
  button.addEventListener("click", () => {
    orderState.payment = button.dataset.payment;
    syncSelectedCards();
  });
});

checkoutAction.addEventListener("click", handleCheckoutAction);
loginSubmit.addEventListener("click", finishLogin);
modalClose.addEventListener("click", closeLogin);

loginModal.addEventListener("click", (event) => {
  if (event.target === loginModal) {
    closeLogin();
  }
});

const observer = new IntersectionObserver(
  (entries) => {
    if (navLockTimer || document.body.classList.contains("checkout-mode")) {
      return;
    }

    const visibleEntry = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (visibleEntry) {
      setActiveNav(visibleEntry.target.dataset.section);
    }
  },
  {
    rootMargin: "-35% 0px -50% 0px",
    threshold: [0.12, 0.35, 0.6],
  },
);

sections.forEach((section) => observer.observe(section));
updateAuthUI();
renderCheckout();
