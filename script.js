const menuButton = document.querySelector('.menu-button');
const navLinks = document.querySelector('.nav-links');

menuButton.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', isOpen);
});

document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  });
});

const bookingForm = document.querySelector('#booking-form');
const formStatus = document.querySelector('#form-status');
const dateInput = document.querySelector('#date');
const dateFeedback = document.querySelector('#date-feedback');
const registrationInput = document.querySelector('#registration');

function validateRegistrationNumber() {
  // Tar bort mellanslag och gör bokstäver stora, exempelvis "abc 123" → "ABC123".
  registrationInput.value = registrationInput.value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  if (!registrationInput.value) {
    registrationInput.setCustomValidity('');
    return true;
  }

  const validFormat = /^(?:[A-Z]{3}\d{3}|[A-Z]{3}\d{2}[A-Z])$/;
  if (!validFormat.test(registrationInput.value)) {
    registrationInput.setCustomValidity('Ange ett registreringsnummer som ABC123 eller ABC12D.');
    return false;
  }

  registrationInput.setCustomValidity('');
  return true;
}

registrationInput.addEventListener('input', validateRegistrationNumber);

// Gör ett datum i formatet YYYY-MM-DD utan att tidszoner påverkar resultatet.
function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

// Beräknar påskdagen. Flera svenska röda dagar räknas från påsken.
function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

function swedishHolidays(year) {
  const fixedDates = [
    `${year}-01-01`, `${year}-01-06`, `${year}-05-01`,
    `${year}-06-06`, `${year}-12-25`, `${year}-12-26`,
  ];
  const easter = easterSunday(year);
  return new Set([
    ...fixedDates,
    dateKey(addDays(easter, -2)), // Långfredagen
    dateKey(addDays(easter, 1)), // Annandag påsk
    dateKey(addDays(easter, 39)), // Kristi himmelsfärdsdag
  ]);
}

function validateBookingDate() {
  if (!dateInput.value) {
    dateInput.setCustomValidity('');
    return true;
  }
  const chosenDate = new Date(`${dateInput.value}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (chosenDate < today) {
    dateInput.setCustomValidity('Välj dagens datum eller ett kommande datum.');
  } else if (chosenDate.getDay() === 0 || chosenDate.getDay() === 6) {
    dateInput.setCustomValidity('Vi har stängt på helger. Välj en vardag.');
  } else if (swedishHolidays(chosenDate.getFullYear()).has(dateInput.value)) {
    dateInput.setCustomValidity('Det valda datumet är en röd dag. Välj en annan vardag.');
  } else {
    dateInput.setCustomValidity('');
  }
  return dateInput.validationMessage === '';
}

dateInput.min = dateKey(new Date());
dateInput.addEventListener('change', () => {
  const isValid = validateBookingDate();

  if (!isValid) {
    const message = dateInput.validationMessage;
    dateInput.value = '';
    dateInput.setCustomValidity('');
    dateFeedback.textContent = message;
    return;
  }

  dateFeedback.textContent = '';
});

bookingForm.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!validateBookingDate()) {
    dateInput.reportValidity();
    return;
  }

  if (!validateRegistrationNumber()) {
    registrationInput.reportValidity();
    return;
  }

  const formData = new FormData(bookingForm);
  const subject = 'Bokningsförfrågan från hemsidan';
  const body = [
    'Hej!',
    '',
    'Jag vill skicka en bokningsförfrågan.',
    '',
    `Namn: ${formData.get('name')}`,
    `Telefonnummer: ${formData.get('phone')}`,
    `Registreringsnummer: ${formData.get('registration')}`,
    `Önskat datum: ${formData.get('date')}`,
    `Tjänst: ${formData.get('service')}`,
    `Meddelande: ${formData.get('message') || '-'}`,
  ].join('\n');

  window.location.href = `mailto:Sebastian@odsmalsdack.se?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  formStatus.textContent = 'Din e-postapp öppnas nu. Kontrollera uppgifterna och tryck sedan på Skicka.';
  bookingForm.reset();
});

document.querySelector('#year').textContent = new Date().getFullYear();
