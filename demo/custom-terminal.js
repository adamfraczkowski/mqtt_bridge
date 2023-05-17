(function (w) {
    const mqttUrl = "wss://test.mosquitto.org:8081/mqtt."
    const inputChannel = "";
    const outputChannel = "";
    
    const term = new Terminal({
        cursorBlink: true,
        macOptionIsMeta: true,
        scrollback: true,
    });
    term.attachCustomKeyEventHandler(customKeyEventHandler);
    // https://github.com/xtermjs/xterm.js/issues/2941
    const fit = new FitAddon.FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon.WebLinksAddon());
    term.loadAddon(new SearchAddon.SearchAddon());
    term.open(document.getElementById("terminal"));
    fit.fit();
    term.resize(30, 80);
    fit.fit();
    term.writeln("You can copy with ctrl+shift+x");
    term.writeln("You can paste with ctrl+shift+v");
    term.writeln('Press Enter key to activate the terminal')
    term.onData((data) => {
        var topicName = "terminal-bridge/input";
        console.log(topicName)
        mqttc.publish(topicName, data);
    });

    const mqttc = mqtt.connect(mqttUrl);
    mqttc.subscribe("terminal-bridge/output")
    const status = document.getElementById("status");

    mqttc.on("message", function (topic, data) {
        console.log(topic)
        if (topic == "terminal-bridge/output") {
            term.write(data);
        }
    });

    mqttc.on("connect", () => {
        fitToscreen();
        console.log("CONNECTED")
    });

    mqttc.on("disconnect", () => {
        console.log("DISCONNECTED")
    });

    function fitToscreen() {
        fit.fit();
        const dims = { data:{cols: term.cols, rows: term.rows}, cmd:"resize_terminal" };
        console.log("sending new dimensions to server's pty", dims);
        mqttc.publish("mqtt-bridge/command", JSON.stringify(dims));
    }

    function debounce(func, wait_ms) {
        let timeout;
        return function (...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait_ms);
        };
    }

    /**
     * Handle copy and paste events
     */
    function customKeyEventHandler(e) {
        if (e.type !== "keydown") {
            return true;
        }
        if (e.ctrlKey && e.shiftKey) {
            const key = e.key.toLowerCase();
            if (key === "v") {
                // ctrl+shift+v: paste whatever is in the clipboard
                navigator.clipboard.readText().then((toPaste) => {
                    term.writeText(toPaste);
                });
                return false;
            } else if (key === "c" || key === "x") {
                // ctrl+shift+x: copy whatever is highlighted to clipboard

                // 'x' is used as an alternate to 'c' because ctrl+c is taken
                // by the terminal (SIGINT) and ctrl+shift+c is taken by the browser
                // (open devtools).
                // I'm not aware of ctrl+shift+x being used by anything in the terminal
                // or browser
                const toCopy = term.getSelection();
                navigator.clipboard.writeText(toCopy);
                term.focus();
                return false;
            }
        }
        return true;
    }

    const wait_ms = 50;
    w.onresize = debounce(fitToscreen, wait_ms);

})(window)