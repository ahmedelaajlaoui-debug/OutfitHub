
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
/**
 * Fonction pour vérifier l'éligibilité au club VIP
 * Appelé lors du clic sur le bouton "vérifier"
 */
function verifierEligibilite() {
    //Récupération des valeurs saisies par l'utilisateur
    var name = document.getElementById('nom').value;
    var age = document.getElementById('age').value;

    //Séction des éléments de l'interface pour l'affichage du résultat 
    var box = document.getElementById('resultat_box');
    var message = document.getElementById('msg_final');


    // Validation : Vérifier si les champs sont vides 
    if (name == "" || age == "") {
        alert("Veuillez remplir tous les champs!");
    }
    else {
        //Afficher las boite de résultat (initialement cachée)
        box.style.display = "block";

        // Logique de vérification de l'âge
        if (age >= 18) {
            // Cas d'éligibilité : Style vert  
            box.style.backgroundColor = "#d4edda";
            box.style.color = "#155724";
            message.innerHTML = "Félicitations <b>" + name + "</b> ! Vous êtes  VIP . Code: VIP2026";
        }
        else {
            // Cas de non-éligibilité : Style rouge 
            box.style.backgroundColor = "#f8d7da";
            box.style.color = "#721c24";
            message.innerHTML = "Désolé <b>" + name + "</b> , le club est réservé aux adultes. ";

        }
    }
}
