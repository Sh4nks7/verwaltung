function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function allowDrop(ev) {
    ev.preventDefault();
}

async function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const auftragElement = document.getElementById(data);
    const neuerStatus = ev.target.closest('.spalte').querySelector('h2').textContent;
    const auftragId = data.split('-')[1];

    try {
        const response = await fetch(`http://localhost:5000/auftraege/${auftragId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: neuerStatus }),
        });

        if (response.ok) {
            ev.target.closest('.spalte').appendChild(auftragElement);
        } else {
            console.error('Fehler beim Aktualisieren des Auftragsstatus');
        }
    } catch (error) {
        console.error('Netzwerkfehler:', error);
    }
}

