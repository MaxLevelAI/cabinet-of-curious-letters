(() => {
  'use strict';

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const header = qs('[data-header]');
  const menuButton = qs('.menu-toggle');
  const nav = qs('#site-nav');
  const mobileBuy = qs('[data-mobile-buy]');
  let lastDialogOpener = null;

  const updateScrollState = () => {
    const isScrolled = window.scrollY > 40;
    header?.classList.toggle('scrolled', isScrolled);
    mobileBuy?.classList.toggle('visible', window.scrollY > window.innerHeight * 0.72);
  };

  updateScrollState();
  window.addEventListener('scroll', updateScrollState, { passive: true });

  const closeMenu = () => {
    nav?.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  };

  menuButton?.addEventListener('click', () => {
    const willOpen = !nav.classList.contains('open');
    nav.classList.toggle('open', willOpen);
    menuButton.setAttribute('aria-expanded', String(willOpen));
    document.body.classList.toggle('menu-open', willOpen);
  });

  qsa('#site-nav a').forEach(link => link.addEventListener('click', closeMenu));
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1100) closeMenu();
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = qsa('.reveal');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(item => item.classList.add('visible'));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -9% 0px', threshold: 0.08 });
    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index % 5, 3) * 55}ms`;
      revealObserver.observe(item);
    });
  }

  const openDialog = (dialog, opener = document.activeElement) => {
    if (!dialog) return;
    lastDialogOpener = opener instanceof HTMLElement ? opener : null;
    closeMenu();
    if (!dialog.open) dialog.showModal();
    requestAnimationFrame(() => {
      const preferred = qs('input:not([type="hidden"]), button:not([data-close]), select, textarea, a[href]', dialog);
      preferred?.focus({ preventScroll: true });
    });
  };

  const closeDialog = dialog => {
    if (!dialog?.open) return;
    dialog.close();
    lastDialogOpener?.focus?.({ preventScroll: true });
  };

  qsa('[data-open]').forEach(button => {
    button.addEventListener('click', () => openDialog(document.getElementById(button.dataset.open), button));
  });

  qsa('[data-close]').forEach(button => {
    button.addEventListener('click', () => closeDialog(button.closest('dialog')));
  });

  qsa('[data-switch-dialog]').forEach(button => {
    button.addEventListener('click', () => {
      const current = button.closest('dialog');
      const returnFocusTarget = lastDialogOpener;
      current?.close();
      openDialog(document.getElementById(button.dataset.switchDialog), returnFocusTarget);
    });
  });

  qsa('dialog').forEach(dialog => {
    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      closeDialog(dialog);
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!inside) closeDialog(dialog);
    });
  });

  qsa('[data-preview-form]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const status = qs('.form-status', form);
      if (!form.reportValidity()) return;
      if (status) status.textContent = 'Preview only — this form is ready to connect at launch, but nothing was sent or saved.';
    });
  });

  const policyDialog = qs('#policy-dialog');
  const policyTitle = qs('#policy-title');
  const policyContent = qs('[data-policy-content]');
  const policies = {
    shipping: {
      title: 'Shipping & mailing',
      html: '<h3>Twenty-five physical mailings</h3><p>Each gift creates one Cabinet postcard followed by 24 weekly Daniel letters. Launch delivery is limited to valid U.S. addresses.</p><h3>Estimated timing</h3><p>Mail dates and arrival dates are estimates. USPS variability means arrival cannot be guaranteed. The first Daniel letter is scheduled about seven days after the Cabinet postcard mails.</p>'
    },
    replacement: {
      title: 'Missing letters & replacements',
      html: '<h3>Keep the sequence intact</h3><p>The buyer can report a specific missing letter through Manage Gift or support. A replacement request preserves the original mailing history and identifies the letter being replaced.</p><h3>Address changes</h3><p>Changes apply only to future unsent mailings. Each past mailing keeps the exact address used at the time.</p>'
    },
    refunds: {
      title: 'Refunds & cancellation',
      html: '<h3>Policy-driven fulfillment</h3><p>Cancellation and refund eligibility depends on how much physical fulfillment has already occurred. A buyer can contact support or use Manage Gift before the applicable fulfillment threshold.</p><p>Final thresholds and legal wording remain launch decisions and must not be hard-coded prematurely.</p>'
    },
    privacy: {
      title: 'Privacy & terms',
      html: '<h3>Recipient data is sensitive</h3><p>The buyer provides a recipient name and physical address for the six-month campaign. The recipient does not need to provide an email address or phone number.</p><h3>Data minimization</h3><ul><li>Recipient addresses are not sent to advertising platforms.</li><li>Marketing consent remains separate from transactional messages.</li><li>Admin access to recipient data is restricted.</li><li>Address changes retain an operational audit trail.</li></ul>'
    }
  };

  qsa('[data-policy]').forEach(button => {
    button.addEventListener('click', () => {
      const policy = policies[button.dataset.policy];
      if (!policy) return;
      policyTitle.textContent = policy.title;
      policyContent.innerHTML = policy.html;
      openDialog(policyDialog, button);
    });
  });

  const checkout = qs('#checkout-dialog');
  const checkoutForm = qs('#checkout-form');
  const steps = qsa('[data-step]', checkoutForm);
  const progress = qsa('[data-progress]', checkout);
  const successPanel = qs('[data-success]', checkoutForm);
  const giftDate = qs('[name="giftDate"]', checkoutForm);
  const dateField = qs('[data-date-field]', checkoutForm);
  const dateLabel = qs('[data-date-label]', checkoutForm);
  const messageField = qs('[name="giftMessage"]', checkoutForm);
  const messageCount = qs('.character-count span', checkoutForm);
  let currentStep = 1;

  const pad = value => String(value).padStart(2, '0');
  const today = new Date();
  const localToday = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  if (giftDate) giftDate.min = localToday;

  const getMethod = () => qs('[name="giftMethod"]:checked', checkoutForm)?.value || 'in_person';

  const updateDateField = () => {
    const method = getMethod();
    const needsDate = method !== 'asap';
    dateField.hidden = !needsDate;
    giftDate.required = needsDate;
    if (!needsDate) giftDate.value = '';
    dateLabel.textContent = method === 'postcard' ? 'Target gift date for the mailed postcard' : 'When will you give the gift?';
  };

  qsa('[name="giftMethod"]', checkoutForm).forEach(radio => radio.addEventListener('change', updateDateField));
  updateDateField();

  messageField?.addEventListener('input', () => {
    messageCount.textContent = String(messageField.value.length);
  });

  const setStep = nextStep => {
    currentStep = Math.max(1, Math.min(4, nextStep));
    steps.forEach(step => {
      const active = Number(step.dataset.step) === currentStep;
      step.hidden = !active;
      step.classList.toggle('active', active);
    });
    successPanel.hidden = true;
    progress.forEach(item => {
      const step = Number(item.dataset.progress);
      item.classList.toggle('active', step === currentStep);
      item.classList.toggle('complete', step < currentStep);
    });
    qs('.checkout-main', checkout)?.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    const heading = qs('h3', steps.find(step => Number(step.dataset.step) === currentStep));
    heading?.setAttribute('tabindex', '-1');
    heading?.focus?.({ preventScroll: true });
  };

  const visibleRequiredFields = step => qsa('input[required], select[required], textarea[required]', step).filter(field => !field.closest('[hidden]'));

  const validateStep = stepNumber => {
    const step = steps.find(item => Number(item.dataset.step) === stepNumber);
    if (!step) return true;
    const fields = visibleRequiredFields(step);
    let firstInvalid = null;
    fields.forEach(field => {
      const valid = field.checkValidity();
      field.classList.toggle('invalid', !valid);
      if (!valid && !firstInvalid) firstInvalid = field;
    });
    const error = qs('.step-error', step);
    if (error) error.textContent = firstInvalid ? 'Please complete the highlighted field before continuing.' : '';
    firstInvalid?.focus();
    return !firstInvalid;
  };

  qsa('input, select, textarea', checkoutForm).forEach(field => {
    field.addEventListener('input', () => field.classList.remove('invalid'));
    field.addEventListener('change', () => field.classList.remove('invalid'));
  });

  const parseLocalDate = value => {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 12);
  };

  const addDays = (date, count) => {
    const next = new Date(date);
    next.setDate(next.getDate() + count);
    return next;
  };

  const formatDate = date => date?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) || '—';

  const methodLabels = {
    in_person: 'Give it in person',
    postcard: 'Let the Cabinet postcard reveal it',
    asap: 'Start as soon as possible'
  };

  const scheduleFor = (method, dateValue) => {
    const chosenDate = parseLocalDate(dateValue);
    if (method === 'in_person' && chosenDate) {
      const postcard = chosenDate;
      const letterOne = addDays(postcard, 7);
      const finalLetter = addDays(letterOne, 23 * 7);
      return {
        review: `Postcard on or just after ${formatDate(postcard)}; Letter No. 1 about one week later`,
        postcard: `On or just after ${formatDate(postcard)}`,
        letter: formatDate(letterOne),
        final: formatDate(finalLetter)
      };
    }
    if (method === 'postcard' && chosenDate) {
      return {
        review: `Postcard timed to target ${formatDate(chosenDate)}; Letter No. 1 about seven days after it mails`,
        postcard: `Target arrival: ${formatDate(chosenDate)}`,
        letter: 'About 7 days after the postcard mails',
        final: 'About 23 weeks after Letter No. 1'
      };
    }
    return {
      review: 'Postcard enters the next fulfillment batch; Letter No. 1 follows about seven days later',
      postcard: 'Next fulfillment batch',
      letter: 'About 7 days after the postcard mails',
      final: 'About 23 weeks after Letter No. 1'
    };
  };

  const valueOf = name => qs(`[name="${name}"]`, checkoutForm)?.value.trim() || '';

  const fillReview = () => {
    const method = getMethod();
    const schedule = scheduleFor(method, giftDate.value);
    qs('[data-review="recipient"]', checkout).textContent = valueOf('recipientName') || '—';
    qs('[data-review="address"]', checkout).textContent = `${valueOf('street')}, ${valueOf('city')}, ${valueOf('state')} ${valueOf('zip')}`;
    qs('[data-review="method"]', checkout).textContent = methodLabels[method];
    qs('[data-review="date"]', checkout).textContent = method === 'asap' ? 'Next fulfillment batch' : formatDate(parseLocalDate(giftDate.value));
    qs('[data-review="schedule"]', checkout).textContent = schedule.review;
  };

  qsa('[data-next]', checkoutForm).forEach(button => {
    button.addEventListener('click', () => {
      if (!validateStep(currentStep)) return;
      if (currentStep === 3) fillReview();
      setStep(currentStep + 1);
    });
  });

  qsa('[data-back]', checkoutForm).forEach(button => {
    button.addEventListener('click', () => setStep(currentStep - 1));
  });

  checkoutForm?.addEventListener('submit', event => {
    event.preventDefault();
    if (!validateStep(4)) return;
    const schedule = scheduleFor(getMethod(), giftDate.value);
    steps.forEach(step => { step.hidden = true; });
    progress.forEach(item => {
      item.classList.remove('active');
      item.classList.add('complete');
    });
    qs('[data-success-postcard]', checkout).textContent = schedule.postcard;
    qs('[data-success-letter]', checkout).textContent = schedule.letter;
    qs('[data-success-final]', checkout).textContent = schedule.final;
    successPanel.hidden = false;
    qs('.checkout-main', checkout)?.scrollTo({ top: 0, behavior: 'auto' });
    const successTitle = qs('#success-title', checkout);
    successTitle?.setAttribute('tabindex', '-1');
    successTitle?.focus?.({ preventScroll: true });
  });

  qs('[data-print]', checkout)?.addEventListener('click', () => window.print());

  checkout?.addEventListener('close', () => {
    window.setTimeout(() => {
      checkoutForm.reset();
      messageCount.textContent = '0';
      qsa('.invalid', checkoutForm).forEach(field => field.classList.remove('invalid'));
      qsa('.step-error', checkoutForm).forEach(error => { error.textContent = ''; });
      updateDateField();
      setStep(1);
    }, 180);
  });

  if (location.hash === '#mud-letters') {
    openDialog(qs('#product-dialog'));
  }
})();
