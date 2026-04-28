
const bar = document.getElementById('bar');
const close = document.getElementById('close');
const nav = document.getElementById('navbar');

if (bar) {
    bar.addEventListener('click', () => {
        nav.classList.add('active');
    });
}

if (close) {
    close.addEventListener('click', () => {
        nav.classList.remove('active');
    });
}

function verifierEligibilite() {
    var name = document.getElementById('nom').value;
    var age = document.getElementById('age').value;
    var box = document.getElementById('resultat_box').value;
    var message = document.getElementById('msg_final').value;


    if (name == "" || age == "") {
        alert("Veuillez remplir tous les champs!");
    }
    else {
        box.style.display = "block";

        if (age >= 18) {
            box, style.backgroundColor = "#d4edda";
            box.style.color = "#155724";
            message.innerHTML = "Félicitations" + name + "!Vous êtes  VIP . Code: VIP2026";
        }
        else {
            box.style, backgroundColor = "#f8d7da";
            box.style.color = "#721c24";
            message.innerHTML = "Désolé" + name + ",le club est réservé aux adultes. ";

        }
    }
}
