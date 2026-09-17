/* =========================================================================
   FarmaBot SOS — Frontend
   -------------------------------------------------------------------------
   CONTRATO CON EL BACKEND (Spring Boot — com.FarmaBot.FarmaBot_SOS)

   Endpoint único: POST {apiBaseUrl}/chat

   Request body (ChatRequest):
     {
       "mensaje": "<texto del usuario>",
       "usuario": "<identificador opcional, puede ir null>"
     }

   Response body (ChatResponse):
     {
       "esEmergencia": true | false,
       "mensaje": "texto ya redactado por el backend/LLM para mostrar tal
                    cual al usuario (en emergencia ya incluye la razón y
                    la indicación de llamar a la línea 123; en la ruta
                    comercial ya incluye la recomendación + disclaimer)",
       "productos": [                     // solo en ruta comercial (RAG, k=3)
         {
           "nombre": "string",
           "indicaciones": "string",
           "categoria": "string",
           "dosisRecomendada": "string",
           "score": 0.0
         }
       ]
     }

   El backend decide internamente si es emergencia (TriageService) y, de
   serlo, dispara la alerta SOS a su propio webhook (AlertService) — el
   frontend NO tiene que llamar a ningún endpoint adicional para eso.

   Si la API de Spring Boot no está disponible, esta interfaz cae en un
   modo de demostración local (mockTriage) con la misma forma de
   respuesta, para poder probar el flujo completo sin servidor.
   ========================================================================= */

  /* =========================================================================
     CONFIGURACIÓN
     Cambia esta URL por la de tu API de Spring Boot. Por defecto el
     backend corre en el puerto 8081 (ver application.properties,
     server.port=8081) bajo el prefijo /api.
     Si la dejas vacía (''), la interfaz usa el modo de demostración local.
     ========================================================================= */
     const apiBaseUrl = 'http://localhost:8081/api';

     const chat = document.getElementById('chat');
     const composer = document.getElementById('composer');
     const userInput = document.getElementById('userInput');
     const sendBtn = document.getElementById('sendBtn');
   
     // Identificador opcional que se envía como "usuario" en cada petición,
     // solo para trazabilidad/logs del backend (no afecta la lógica del chat).
     const usuarioId = 'web-' + Math.random().toString(36).slice(2, 10);
     let emergencyLock = false;
   
     function scrollToBottom(){
       chat.scrollTop = chat.scrollHeight;
     }
   
     function addUserMessage(text){
       const div = document.createElement('div');
       div.className = 'msg user';
       div.textContent = text;
       chat.appendChild(div);
       scrollToBottom();
     }
   
     function addBotMessage(text){
       const div = document.createElement('div');
       div.className = 'msg bot';
       div.textContent = text;
       chat.appendChild(div);
       scrollToBottom();
     }
   
     function addDisclaimer(){
       const div = document.createElement('div');
       div.className = 'disclaimer';
       div.textContent = 'Esta respuesta es solo una guía informativa y no reemplaza la valoración de un médico o farmacéutico.';
       chat.appendChild(div);
       scrollToBottom();
     }
   
     function addProducts(productos){
       if(!productos || !productos.length) return;
       const wrap = document.createElement('div');
       wrap.className = 'products';
       productos.forEach(p => {
         const card = document.createElement('div');
         card.className = 'product-card';
         card.innerHTML = `
           <div class="p-name">${escapeHtml(p.nombre || '')}</div>
           <div class="p-meta">${escapeHtml(p.categoria || '')} · ${escapeHtml(p.indicaciones || '')}</div>
           <div class="p-dose">${escapeHtml(p.dosisRecomendada || '')}</div>
         `;
         wrap.appendChild(card);
       });
       chat.appendChild(wrap);
       scrollToBottom();
     }
   
     function addEmergencyAlert(mensaje){
       const div = document.createElement('div');
       div.className = 'alert';
       div.setAttribute('role', 'alert');
       div.innerHTML = `
         <div class="a-title"><span class="pulse" aria-hidden="true"></span> Esto suena a una emergencia médica</div>
         <p>${escapeHtml(mensaje || 'Busca atención médica urgente ahora mismo.')}</p>
         <div class="a-actions">
           <a href="tel:123">Llamar al 123</a>
           <a href="tel:911" class="secondary">Llamar al 911</a>
         </div>
       `;
       chat.appendChild(div);
       scrollToBottom();
     }
   
     function addTyping(){
       const div = document.createElement('div');
       div.className = 'typing';
       div.id = 'typingIndicator';
       div.innerHTML = '<span></span><span></span><span></span>';
       chat.appendChild(div);
       scrollToBottom();
       return div;
     }
   
     function removeTyping(node){
       if(node && node.parentNode) node.parentNode.removeChild(node);
     }
   
     function escapeHtml(str){
       const d = document.createElement('div');
       d.textContent = str;
       return d.innerHTML;
     }
   
     function lockComposer(){
       emergencyLock = true;
       composer.classList.add('locked');
       userInput.disabled = true;
       sendBtn.disabled = true;
     }
   
     /* -------------------- Clasificador de respaldo (modo demo) --------------------
        Solo se usa si apiBaseUrl está vacía o la petición real falla. */
     const EMERGENCY_PATTERNS = [
       { kw: ['dolor en el pecho', 'dolor de pecho', 'opresión en el pecho'], razon: 'posible señal cardíaca (dolor u opresión en el pecho)' },
       { kw: ['falta de aire', 'no puedo respirar', 'dificultad para respirar', 'ahogo'], razon: 'dificultad respiratoria aguda' },
       { kw: ['visión borrosa de repente', 'perdida de vision', 'pérdida de visión'], razon: 'alteración visual súbita' },
       { kw: ['convulsion', 'convulsión', 'convulsiones'], razon: 'posible cuadro convulsivo' },
       { kw: ['sangrado abundante', 'hemorragia', 'sangre que no para'], razon: 'sangrado que no cede' },
       { kw: ['desmayo', 'perdida de conciencia', 'pérdida de conciencia'], razon: 'pérdida de conciencia' },
       { kw: ['infarto'], razon: 'sospecha de infarto' },
     ];
   
     const MOCK_CATALOG = [
       { tags: ['dolor de cabeza', 'cefalea', 'migraña'], nombre: 'Acetaminofén 500mg', categoria: 'Analgésico', indicaciones: 'Alivio de dolor leve a moderado y fiebre.', dosisRecomendada: '1 tableta cada 6-8h, máx. 4/día' },
       { tags: ['gripa', 'gripe', 'tos', 'congestión'], nombre: 'Jarabe antigripal', categoria: 'Sistema respiratorio', indicaciones: 'Alivio de síntomas de gripa: tos, congestión y malestar general.', dosisRecomendada: '10ml cada 8h por máx. 5 días' },
       { tags: ['alergia', 'rinitis', 'estornudos', 'picazon'], nombre: 'Loratadina 10mg', categoria: 'Antihistamínico', indicaciones: 'Alivio de síntomas alérgicos: estornudos, picazón, rinitis.', dosisRecomendada: '1 tableta al día' },
       { tags: ['acidez', 'agruras', 'reflujo'], nombre: 'Omeprazol 20mg', categoria: 'Antiácido', indicaciones: 'Alivio de acidez estomacal y reflujo ocasional.', dosisRecomendada: '1 cápsula al día en ayunas' },
       { tags: ['dolor muscular', 'golpe', 'inflamación'], nombre: 'Ibuprofeno 400mg', categoria: 'Antiinflamatorio', indicaciones: 'Dolor muscular, inflamación leve y molestias articulares.', dosisRecomendada: '1 tableta cada 8h con alimentos' },
       { tags: ['diarrea', 'malestar estomacal'], nombre: 'Sales de rehidratación oral', categoria: 'Gastrointestinal', indicaciones: 'Reposición de líquidos y electrolitos en diarrea leve.', dosisRecomendada: '1 sobre disuelto cada episodio' },
     ];
   
     function mockTriage(text){
       const lower = text.toLowerCase();
       for(const p of EMERGENCY_PATTERNS){
         if(p.kw.some(k => lower.includes(k))){
           return {
             esEmergencia: true,
             mensaje: 'Esto podría ser una EMERGENCIA: ' + p.razon + '. Por favor busca atención inmediata en la línea 123 o 911.',
             productos: []
           };
         }
       }
       // Ruta comercial simulada: similitud por coincidencia de tags (proxy de coseno)
       const scored = MOCK_CATALOG.map(item => {
         const score = item.tags.reduce((acc, tag) => acc + (lower.includes(tag) ? 1 : 0), 0);
         return { item, score };
       }).sort((a, b) => b.score - a.score);
   
       const matched = scored.filter(s => s.score > 0).slice(0, 3);
       const top = matched.length ? matched : scored.slice(0, 3);
   
       return {
         esEmergencia: false,
         mensaje: matched.length
           ? 'Según lo que describes, estas opciones de venta libre podrían ayudarte con síntomas leves. Esta respuesta es solo una guía y no reemplaza la opinión de un médico o farmacéutico.'
           : 'No identifiqué síntomas específicos, pero aquí tienes algunas opciones frecuentes de venta libre. Cuéntame más para afinar la recomendación.',
         productos: top.map(s => ({
           nombre: s.item.nombre,
           categoria: s.item.categoria,
           indicaciones: s.item.indicaciones,
           dosisRecomendada: s.item.dosisRecomendada,
           score: s.score
         }))
       };
     }
   
     async function callBackend(text){
       if(apiBaseUrl){
         try{
           const res = await fetch(apiBaseUrl + '/chat', {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
               'Accept': 'application/json'
             },
             body: JSON.stringify({ mensaje: text, usuario: usuarioId })
           });
           if(!res.ok) throw new Error('El backend respondió con estado ' + res.status);
           return await res.json();
         }catch(e){
           console.warn('No se pudo contactar la API de Spring Boot, usando modo demo:', e);
           return mockTriage(text);
         }
       }
       return mockTriage(text);
     }
   
     async function handleSend(text){
       addUserMessage(text);
       userInput.value = '';
       userInput.style.height = 'auto';
   
       const typingNode = addTyping();
       const result = await callBackend(text);
       // pequeña espera para que el indicador de "escribiendo" se sienta natural
       await new Promise(r => setTimeout(r, 450));
       removeTyping(typingNode);
   
       if(result.esEmergencia){
         // El backend ya disparó la alerta SOS a su webhook internamente.
         addEmergencyAlert(result.mensaje);
         lockComposer();
         return;
       }
   
       if(result.mensaje) addBotMessage(result.mensaje);
       addProducts(result.productos);
       if(result.productos && result.productos.length) addDisclaimer();
     }
   
     composer.addEventListener('submit', (e) => {
       e.preventDefault();
       if(emergencyLock) return;
       const text = userInput.value.trim();
       if(!text) return;
       handleSend(text);
     });
   
     userInput.addEventListener('keydown', (e) => {
       if(e.key === 'Enter' && !e.shiftKey){
         e.preventDefault();
         composer.requestSubmit();
       }
     });
   
     userInput.addEventListener('input', () => {
       userInput.style.height = 'auto';
       userInput.style.height = Math.min(userInput.scrollHeight, 90) + 'px';
     });
   
     // Mensaje de bienvenida
     addBotMessage('Hola, soy Baymax, tu asistente médico personal. Tienes algun problema?, Si es una emergencia, te conecto de inmediato con ayuda.');