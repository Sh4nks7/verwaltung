async function ladeAuftraege() {
    try {
        const response = await fetch('http://localhost:5000/auftraege');
        const auftraege = await response.json();
        
        const container = document.getElementById('auftragsContainer');
        container.innerHTML = '';
        
        const spalten = ['Offen', 'In Bearbeitung', 'Termin', 'noch Vorbeigehen', 'Erledigt', 'Rechnung'];
        spalten.forEach(status => {
            const spalte = document.createElement('div');
            spalte.className = 'spalte';
            spalte.innerHTML = `<h2>${status}</h2>`;
            
            auftraege.filter(a => a.status === status).forEach(auftrag => {
                const auftragElement = document.createElement('div');
                auftragElement.className = 'auftrag';
                auftragElement.draggable = true;
                auftragElement.id = `auftrag-${auftrag.id}`;
                auftragElement.innerHTML = `
                    <h3>${auftrag.kunde}</h3>
                    <p>${auftrag.problem}</p>
                `;
                auftragElement.addEventListener('dragstart', drag);
                spalte.appendChild(auftragElement);
            });
            
            spalte.addEventListener('dragover', allowDrop);
            spalte.addEventListener('drop', drop);
            container.appendChild(spalte);
        });
    } catch (error) {
        console.error('Fehler beim Laden der Aufträge:', error);
    }
}

