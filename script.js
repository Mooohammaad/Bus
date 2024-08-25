// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBiLF-4SEezRt55fV6IXL31S1PeQsox_uk",
    authDomain: "crot-88dc7.firebaseapp.com",
    projectId: "crot-88dc7",
    storageBucket: "crot-88dc7.appspot.com",
    messagingSenderId: "667342612332",
    appId: "1:667342612332:web:d98179ee15fbe82716f549"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let bookings = [];

// Retrieve bookings from Firebase
function fetchBookings() {
    const dbRef = ref(db);
    get(child(dbRef, 'bookings')).then((snapshot) => {
        if (snapshot.exists()) {
            bookings = snapshot.val();
            updateSeatMap();
        }
    }).catch((error) => {
        console.error("Error fetching bookings: ", error);
    });
}

// Generate seat map
function generateSeatMap() {
    const seatsContainer = document.querySelector('.seats');
    for (let i = 1; i <= 14; i++) {
        const seat = document.createElement('div');
        seat.classList.add('seat');
        seat.textContent = i;
        seatsContainer.appendChild(seat);
    }
}

// Update seat map based on bookings
function updateSeatMap() {
    const bus = document.getElementById('bus').value;
    const date = document.getElementById('date').value;
    const seats = document.querySelectorAll('.seat');
    
    seats.forEach(seat => {
        seat.classList.remove('selected');
    });

    const bookedSeats = bookings.filter(booking => booking.bus === bus && booking.date === date);
    bookedSeats.forEach((booking, index) => {
        const seat = seats[index];
        seat.classList.add('selected');
    });
}

// Initialize date input with today's date
function initializeDateInput() {
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
}

// Handle form submission for booking
function handleBookingForm(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const date = document.getElementById('date').value;
    const bus = document.getElementById('bus').value;
    const busTimes = {
        bus1: "9:00 AM",
        bus2: "12:00 PM",
        bus3: "3:00 PM",
        bus4: "6:00 PM"
    };

    if (!validateForm(name, phone)) return;

    const bookedDate = localStorage.getItem('bookedDate');
    if (bookedDate === date) {
        alert('لقد قمت بحجز بالفعل في هذا اليوم.');
        return;
    }

    const bookedSeats = bookings.filter(booking => booking.bus === bus && booking.date === date).length;
    if (bookedSeats >= 14) {
        alert('لا يوجد مقاعد متاحة في هذا الباص في هذا التوقيت والتاريخ');
        return;
    }

    const confirmationMessage = `تفاصيل الحجز⬇️\nالإسم: ${name}\nوقت الباص: ${busTimes[bus]}\nالتاريخ: ${date}\nرقم الهاتف: ${phone}`;
    const userConfirmed = confirm(confirmationMessage);

    if (userConfirmed) {
        const newBooking = { name, phone, date, bus };
        bookings.push(newBooking);

        set(ref(db, 'bookings'), bookings)
            .then(() => {
                updateSeatMap();
                const confirmationText = `تم الحجز بإسم , ${name}\nالساعه ${busTimes[bus]}\nبتاريخ ${date}\nورقمك هو ${phone}`;
                document.getElementById('confirmation').innerText = confirmationText;
                alert(`تم تأكيد الحجز بنجاح.\n${confirmationText}`);
                localStorage.setItem('bookedDate', date);
                document.getElementById('remove-seat-button').style.display = 'block';
            })
            .catch((error) => {
                alert('Booking Failed: ' + error);
            });
    } else {
        alert('تم إلغاء الحجز.');
    }
}

// Validate form inputs
function validateForm(name, phone) {
    const nameParts = name.trim().split(/\s+/);
    if (name.length < 10 || nameParts.length < 3) {
        alert('يجب إدخال اسمك ثلاثي ');
        return false;
    }

    const phonePattern = /^(011|010|012|015)\d{8}$/;
    if (!phonePattern.test(phone)) {
        alert('رقم الهاتف هذا غير صحيح');
        return false;
    }

    return true;
}

// Handle seat removal
function handleSeatRemoval() {
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const date = document.getElementById('date').value;
    const bus = document.getElementById('bus').value;

    const userConfirmed = confirm('هل أنت متأكد أنك تريد حذف مقعدك؟');
    if (userConfirmed) {
        const bookingToRemove = bookings.find(booking =>
            booking.name === name &&
            booking.phone === phone &&
            booking.date === date &&
            booking.bus === bus
        );

        if (bookingToRemove) {
            bookings = bookings.filter(booking => booking !== bookingToRemove);
            set(ref(db, 'bookings'), bookings)
                .then(() => {
                    updateSeatMap();
                    document.getElementById('remove-seat-button').style.display = 'none';
                    localStorage.removeItem('bookedDate');
                    alert('تم حذف مقعدك بنجاح');
                })
                .catch((error) => {
                    alert('Failed to remove booking: ' + error);
                });
        } else {
            alert('ادخل بياناتك السابقه لتأكيد إزالة حجزك');
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeDateInput();
    fetchBookings();
    generateSeatMap();

    document.getElementById('bus').addEventListener('change', updateSeatMap);
    document.getElementById('date').addEventListener('change', updateSeatMap);

    document.getElementById('booking-form').addEventListener('submit', handleBookingForm);
    document.getElementById('remove-seat-button').addEventListener('click', handleSeatRemoval);
});