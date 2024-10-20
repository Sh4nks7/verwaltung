let calendar;

document.addEventListener('DOMContentLoaded', function() {
    const neuerAuftragButton = document.getElementById('neuerAuftragButton');
    const neuerAuftragModal = document.getElementById('neuerAuftragModal');
    const neuerAuftragForm = document.getElementById('neuerAuftragForm');

    neuerAuftragButton.onclick = setupNeuerAuftragForm;

    const anhangInput = document.getElementById('anhang');
    const ausgewaehlteDateien = document.getElementById('ausgewaehlte-dateien');

    anhangInput.addEventListener('change', function(e) {
        ausgewaehlteDateien.innerHTML = '';
        for (let i = 0; i < this.files.length; i++) {
            ausgewaehlteDateien.innerHTML += `<p>${this.files[i].name}</p>`;
        }
    });

    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.onclick = function() {
            this.closest('.modal').style.display = 'none';
        };
    });

    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };

    ladeAuftraege();

    const kalenderButton = document.getElementById('kalenderButton');
    const kalenderModal = document.getElementById('kalenderModal');

    kalenderButton.onclick = () => {
        kalenderModal.style.display = 'block';
        if (!calendar) {
            initializeCalendar();
        }
        updateCalendarEvents();
    };
});

function initializeCalendar() {
    const calendarEl = document.getElementById('kalender');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        locale: 'de',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        buttonText: {
            today: 'Heute',
            month: 'Monat',
            week: 'Woche',
            day: 'Tag'
        },
        height: 'auto',
        allDaySlot: false,
        slotDuration: '01:00:00',
        slotMinTime: '07:00:00',
        slotMaxTime: '21:00:00',
        expandRows: true,
        businessHours: {
            daysOfWeek: [ 1, 2, 3, 4, 5 ], // Montag bis Freitag
            startTime: '07:00',
            endTime: '21:00',
        },
        events: [],
        eventClick: function(info) {
            alert('Auftrag: ' + info.event.title + '\n' + info.event.extendedProps.kommentar);
        },
        eventContent: function(arg) {
            return {
                html: `<div class="custom-event">
                         <div class="event-title">${arg.event.title}</div>
                         <div class="event-time">${arg.timeText}</div>
                       </div>`
            };
        },
        slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        },
        eventTimeFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }
    });
    calendar.render();
}

async function updateCalendarEvents() {
    try {
        const response = await fetch('http://127.0.0.1:5000/auftraege');
        const auftraege = await response.json();
        const events = auftraege.flatMap(auftrag => 
            auftrag.kommentare
                .filter(kommentar => kommentar.termin)
                .map(kommentar => ({
                    title: `A${auftrag.id}: ${auftrag.kunde.substring(0, 15)}`,
                    start: kommentar.termin,
                    end: new Date(new Date(kommentar.termin).getTime() + 30*60000), // 30 Minuten Dauer
                    extendedProps: {
                        auftragId: auftrag.id,
                        kommentar: kommentar.text
                    }
                }))
        );
        calendar.removeAllEvents();
        calendar.addEventSource(events);
    } catch (error) {
        console.error('Fehler beim Laden der Kalenderereignisse:', error);
    }
}

// Funktion zum Laden und Anzeigen der Aufträge
async function ladeAuftraege() {
    try {
        const response = await fetch('http://127.0.0.1:5000/auftraege');
        const auftraege = await response.json();
        zeigeAuftraege(auftraege);
    } catch (error) {
        console.error('Fehler beim Laden der Aufträge:', error);
    }
}

// Funktion zum Anzeigen der Aufträge in den Spalten
function zeigeAuftraege(auftraege) {
    const spalten = ['offen', 'inBearbeitung', 'termin', 'erledigt', 'rechnung'];
    spalten.forEach(status => {
        const spalte = document.getElementById(status);
        spalte.innerHTML = `<h2>${status.charAt(0).toUpperCase() + status.slice(1)}</h2>`;
        const gefiltereAuftraege = auftraege.filter(auftrag => {
            const auftragStatus = auftrag.status.toLowerCase().replace(' ', '');
            return auftragStatus === status.toLowerCase();
        });
        console.log(`Gefilterte Aufträge für ${status}:`, gefiltereAuftraege);  // Debugging
        gefiltereAuftraege.forEach(auftrag => {
            const auftragElement = erstelleAuftragElement(auftrag);
            spalte.appendChild(auftragElement);
        });
        spalte.ondragover = dragOver;
        spalte.ondrop = drop;
    });
}

// Funktion zum Erstellen eines Auftragselements
function erstelleAuftragElement(auftrag) {
    const auftragElement = document.createElement('div');
    auftragElement.className = `auftrag ${auftrag.wichtigkeit.toLowerCase()}`;
    auftragElement.draggable = true;
    auftragElement.id = `auftrag-${auftrag.id}`;
    auftragElement.innerHTML = `
        <h3>Auftrag ${auftrag.id}</h3>
        <p><strong>Adresse:</strong> ${auftrag.adresse}</p>
        <p><strong>Mieter:</strong> ${auftrag.mieter}</p>
        <p><strong>Tel. Nr.:</strong> ${auftrag.telNr}</p>
        <p><strong>Problem:</strong> ${auftrag.problem}</p>
        <div class="auftrag-aktionen">
            <button class="aktion-btn ansicht-btn" onclick="zeigeAuftragDetails(${auftrag.id})"><i class="fas fa-eye"></i></button>
            <button class="aktion-btn bearbeiten-btn" onclick="bearbeiteAuftrag(${auftrag.id})"><i class="fas fa-pencil-alt"></i></button>
            <button class="aktion-btn loeschen-btn" onclick="loescheAuftrag(${auftrag.id})"><i class="fas fa-trash"></i></button>
        </div>
    `;
    auftragElement.ondragstart = dragStart;
    return auftragElement;
}

// Funktion zum Anzeigen der Auftragdetails
async function zeigeAuftragDetails(auftragId) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/auftraege/${auftragId}`);
        const auftrag = await response.json();
        
        const detailModal = document.getElementById('auftragDetailModal');
        const detailContent = detailModal.querySelector('.modal-content');
        
        let kommentareHTML = '<h3>Kommentare und Termine</h3><ul>';
        if (auftrag.kommentare && auftrag.kommentare.length > 0) {
            auftrag.kommentare.forEach(kommentar => {
                let kommentarText = `${kommentar.name} - ${kommentar.text}`;
                if (kommentar.termin) {
                    kommentarText += `<br>Termin: ${new Date(kommentar.termin).toLocaleString('de-DE')}`;
                }
                kommentareHTML += `<li>${kommentarText}</li>`;
            });
        } else {
            kommentareHTML += '<li>Keine Kommentare vorhanden</li>';
        }
        kommentareHTML += '</ul>';

        const kommentarForm = `
            <form id="kommentarForm">
                <input type="text" name="name" placeholder="Name" required>
                <textarea name="text" placeholder="Kommentar" required></textarea>
                <input type="datetime-local" name="termin">
                <button type="submit">Kommentar/Termin hinzufügen</button>
            </form>
        `;

        detailContent.innerHTML = `
            <span class="close">&times;</span>
            <h2>Auftrag Details</h2>
            <p><strong>Kunde:</strong> ${auftrag.kunde}</p>
            <p><strong>Adresse:</strong> ${auftrag.adresse}</p>
            <p><strong>Mieter:</strong> ${auftrag.mieter}</p>
            <p><strong>Telefon:</strong> ${auftrag.telefon}</p>
            <p><strong>E-Mail:</strong> ${auftrag.email}</p>
            <p><strong>Problem:</strong> ${auftrag.problem}</p>
            <p><strong>Wichtigkeit:</strong> ${auftrag.wichtigkeit}</p>
            <p><strong>Status:</strong> ${auftrag.status}</p>
            ${kommentareHTML}
            ${kommentarForm}
            <h3>Anhänge:</h3>
            <ul id="anhaenge-liste">
                ${auftrag.anhaenge ? auftrag.anhaenge.map(anhang => `
                    <li><a href="${anhang.pfad}" target="_blank">${anhang.name}</a></li>
                `).join('') : 'Keine Anhänge vorhanden'}
            </ul>
            <div class="print-button-container">
                <button id="druckenButton" class="aktion-btn"><i class="fas fa-print"></i> Auftrag Drucken</button>
            </div>
        `;

        const kommentarFormElement = detailContent.querySelector('#kommentarForm');
        kommentarFormElement.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(kommentarFormElement);
            const kommentarData = Object.fromEntries(formData.entries());
            
            if (kommentarData.termin) {
                kommentarData.termin = new Date(kommentarData.termin).toISOString();
            }

            try {
                const response = await fetch(`http://127.0.0.1:5000/auftraege/${auftrag.id}/kommentare`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(kommentarData),
                });

                if (response.ok) {
                    zeigeAuftragDetails(auftrag.id);
                    updateCalendarEvents(); // Aktualisiert den Kalender
                } else {
                    console.error('Fehler beim Hinzufügen des Kommentars/Termins');
                }
            } catch (error) {
                console.error('Netzwerkfehler:', error);
            }
        };

        const druckenButton = detailContent.querySelector('#druckenButton');
        druckenButton.onclick = () => druckeAuftrag(auftrag);

        const closeButton = detailContent.querySelector('.close');
        closeButton.onclick = () => {
            detailModal.style.display = 'none';
        };

        detailModal.style.display = 'block';
    } catch (error) {
        console.error('Fehler beim Laden der Auftragdetails:', error);
    }
}

// Funktion zum Drucken eines Auftrags
function druckeAuftrag(auftrag) {
    const druckFenster = window.open('', '', 'width=800,height=600');
    druckFenster.document.write(`
        <html>
            <head>
                <title>Auftrag ${auftrag.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    h1 { text-align: center; }
                </style>
            </head>
            <body>
                <h1>Auftrag ${auftrag.id}</h1>
                <p><strong>Kunde:</strong> ${auftrag.kunde}</p>
                <p><strong>Adresse:</strong> ${auftrag.adresse}</p>
                <p><strong>Mieter:</strong> ${auftrag.mieter}</p>
                <p><strong>Telefon:</strong> ${auftrag.telefon}</p>
                <p><strong>E-Mail:</strong> ${auftrag.email}</p>
                <p><strong>Problem:</strong> ${auftrag.problem}</p>
                <p><strong>Wichtigkeit:</strong> ${auftrag.wichtigkeit}</p>
                <p><strong>Status:</strong> ${auftrag.status}</p>
                
                <h2>Kommentare und Termine</h2>
                <ul>
                    ${auftrag.kommentare.map(kommentar => `
                        <li>
                            ${kommentar.name} - ${kommentar.text}
                            ${kommentar.termin ? `<br>Termin: ${new Date(kommentar.termin).toLocaleString('de-DE')}` : ''}
                        </li>
                    `).join('')}
                </ul>
            </body>
        </html>
    `);
    druckFenster.document.close();
    druckFenster.print();
}

async function bearbeiteAuftrag(auftragId) {
    console.log('bearbeiteAuftrag aufgerufen mit ID:', auftragId);
    try {
        const response = await fetch(`http://127.0.0.1:5000/auftraege/${auftragId}`);
        const auftrag = await response.json();
        
        const modal = document.getElementById('neuerAuftragModal');
        const form = document.getElementById('neuerAuftragForm');
        const modalTitle = modal.querySelector('h2');
        
        modalTitle.textContent = 'Auftrag bearbeiten';
        
        // Füllen Sie das Formular mit den aktuellen Auftragsdaten
        form.kunde.value = auftrag.kunde;
        form.adresse.value = auftrag.adresse;
        form.mieter.value = auftrag.mieter;
        form.telefon.value = auftrag.telefon;
        form.email.value = auftrag.email;
        form.problem.value = auftrag.problem;
        form.wichtigkeit.value = auftrag.wichtigkeit;
        
        // Entfernen Sie das Status-Feld aus dem Formular
        const statusField = form.querySelector('[name="status"]');
        if (statusField) {
            statusField.remove();
        }
        
        // Entfernen Sie alle bestehenden Event-Listener
        form.onsubmit = null;
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        // Fügen Sie den neuen Event-Listener hinzu
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(newForm);
            const updatedAuftrag = Object.fromEntries(formData.entries());
            
            // Fügen Sie den aktuellen Status hinzu
            updatedAuftrag.status = auftrag.status;
            
            try {
                const response = await fetch(`http://127.0.0.1:5000/auftraege/${auftragId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedAuftrag)
                });

                if (response.ok) {
                    alert('Auftrag erfolgreich aktualisiert!');
                    modal.style.display = 'none';
                    ladeAuftraege();
                } else {
                    console.error('Fehler beim Aktualisieren des Auftrags');
                    alert('Fehler beim Aktualisieren des Auftrags');
                }
            } catch (error) {
                console.error('Netzwerkfehler:', error);
                alert('Ein Fehler ist aufgetreten');
            }
        });
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Fehler beim Laden der Auftragdetails:', error);
    }
}

function loescheAuftrag(auftragId) {
    if (confirm('Sind Sie sicher, dass Sie diesen Auftrag löschen möchten?')) {
        fetch(`http://127.0.0.1:5000/auftraege/${auftragId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                ladeAuftraege(); // Aktualisiere die Auftragsliste
            } else {
                console.error('Fehler beim Löschen des Auftrags');
            }
        })
        .catch(error => console.error('Netzwerkfehler:', error));
    }
}

function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.id);
}

function dragOver(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const auftragId = e.dataTransfer.getData('text').split('-')[1];
    const neuerStatus = e.target.closest('.spalte').id;
    aktualisiereAuftragStatus(auftragId, neuerStatus);
}

async function aktualisiereAuftragStatus(auftragId, neuerStatus) {
    console.log('Aktualisiere Status:', auftragId, neuerStatus);
    let statusToSend = neuerStatus;
    if (neuerStatus === 'inBearbeitung') {
        statusToSend = 'In Bearbeitung';
    }
    try {
        const response = await fetch(`http://127.0.0.1:5000/auftraege/${auftragId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: statusToSend }),
        });

        if (response.ok) {
            ladeAuftraege();
        } else {
            console.error('Fehler beim Aktualisieren des Auftragsstatus');
        }
    } catch (error) {
        console.error('Netzwerkfehler:', error);
    }
}

window.addEventListener('resize', function() {
    if (calendar) {
        calendar.updateSize();
    }
});

function setupNeuerAuftragForm() {
    const modal = document.getElementById('neuerAuftragModal');
    const form = document.getElementById('neuerAuftragForm');
    const modalTitle = modal.querySelector('h2');
    
    modalTitle.textContent = 'Neuer Auftrag';
    form.reset(); // Leert das Formular
    
    // Fügen Sie das Status-Feld wieder hinzu, falls es entfernt wurde
    if (!form.querySelector('[name="status"]')) {
        const statusField = document.createElement('select');
        statusField.name = 'status';
        statusField.innerHTML = `
            <option value="Offen">Offen</option>
            <option value="In Bearbeitung">In Bearbeitung</option>
            <option value="Abgeschlossen">Abgeschlossen</option>
        `;
        form.appendChild(statusField);
    }
    
    // Entfernen Sie alle bestehenden Event-Listener
    form.onsubmit = null;
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Fügen Sie den neuen Event-Listener hinzu
    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(newForm);
        
        try {
            const response = await fetch('http://127.0.0.1:5000/auftraege', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                alert('Auftrag erfolgreich erstellt!');
                modal.style.display = 'none';
                ladeAuftraege();
            } else {
                alert('Fehler beim Erstellen des Auftrags');
            }
        } catch (error) {
            console.error('Fehler:', error);
            alert('Ein Fehler ist aufgetreten');
        }
    });
    
    modal.style.display = 'block';
}
