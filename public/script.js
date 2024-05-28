import { HarmBlockThreshold, HarmCategory, GoogleGenerativeAI } from "@google/generative-ai";

const boxes = document.querySelectorAll('.box'), select = document.getElementsByTagName("select")[0], start = document.getElementById("start"),
    textarea = document.getElementById("speech"), model = new GoogleGenerativeAI("AIzaSyD4BG4OPe3r49HfUP7qllKFooysigwJjD0").getGenerativeModel({
        model: "gemini-1.5-flash-latest",
        systemInstruction: "You are a reply predicting AI. You provide some possible short replies separated by commas to the prompt given to you ",
        generationConfig: {
            maxOutputTokens: 32,
            temperature: 0.9,
            topP: 1,
            topK: 3
        }, safetySettings: [{
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        }, {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        }, {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        }, {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        }]
    }), ai = document.getElementById("suggestions");

select.value = localStorage.lang || "en-IN";
select.oninput = () => localStorage.setItem("lang", select.value);

let recActive = false, rec, audioContext, analyser, bufferLength, dataArray, speechStop = 0;

start.onclick = elm => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 32;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        audioContext.createMediaStreamSource(stream).connect(analyser);
        stt();
        setInterval(() => {
            analyser.getByteTimeDomainData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += Math.abs(dataArray[i] - 128);
            }
            const amplitude = (sum / (bufferLength * 6)) * speechStop;

            boxes.forEach(dabba => {
                if (amplitude > 0.069 || speechStop == 0) {
                    dabba.style.translate = `${(Math.random() > .5 ? -1 : 1) * amplitude * 2}vw ${(Math.random() > .5 ? -1 : 1) * amplitude * 2}vw`;
                    dabba.style.scale = 1 + (amplitude / 8);
                }
            });
        }, 99);
    }).catch(err => alert(err));
}

function stt() {
    if (recActive) {
        rec.abort();
        boxes[0].parentElement.style.filter = "grayscale(1)";
        start.classList.remove("speaking");
        recActive = false;
        speechStop = 0;
        
        return;
    } else {
        textarea.innerHTML = "";
        rec = new webkitSpeechRecognition();
        rec.continuous = true;
        rec.lang = select.value;
        rec.onaudiostart = () => {
            boxes[0].parentElement.style.filter = "grayscale(0)";
            start.classList.add("speaking");
            speechStop = 1;
            textarea.placeholder = "Listening...";
            recActive = true;
            Array.from(ai.children).slice(0, -1).forEach(child => child.remove());
        }
        rec.start();
    }
    rec.onnomatch = () => speechStop = 0;
    rec.onend = () => speechStop = 0;

    rec.onerror = e => {
        switch (e.error) {
            case "aborted": break;
            case "not-allowed": alert("Permission to use microphone was denied."); break
            case "no-speech": alert("Say something!"); break
            case "network": alert("No Internet"); break
            default: alert(`${e.error}: ${e.message}`);
        }
        speechStop = 0
        recActive = false;
    }
    rec.onresult = e => {
        const transcript = e.results[e.results.length - 1][0].transcript;
        textarea.innerHTML += transcript + " ";
        if (select.value == ("en-IN" || "hi-IN" || "bn-IN")) {
            run();
        } else {
            const i = document.createElement("i");
            i.innerHTML = "AI not available in this language";
            ai.appendChild(i);
        }
    }
}

async function run() {
    const result = await model.generateContent(textarea.innerHTML),
        array = result.response.text().split(",");
    Array.from(ai.children).slice(0, -1).forEach(child => child.remove());
    if (array.length > 2) array.forEach((reply, index) => {
        if (reply.length > 1) {
            const button = document.createElement("button");
            button.innerHTML = reply;
            button.style.animationDelay = `${index * 0.1}s`;
            button.setAttribute("tabindex", 0);
            ai.appendChild(button);
        }
    });
}

document.forms[0].onsubmit = e => {
    e.preventDefault();
    const button = document.createElement("button");
    button.innerHTML = new FormData(e.target).get("reply");
    button.style.animationDelay = ".1s";
    button.setAttribute("tabindex", 0);
    ai.appendChild(button);
    document.querySelector("#suggestions > i")?.remove(); ƒ
    setTimeout(() => button.focus(), 99);
}

setInterval(() => boxes.forEach(dabba => dabba.style.borderRadius = Array.from({ length: 8 }, () => `${Math.floor(Math.random() * 51) + 50}%`).join(' ').replace(/(.*) (.*) (.*) (.*) (.*) (.*) (.*) (.*)/, '$1 $2 $3 $4 / $5 $6 $7 $8')), 2000);