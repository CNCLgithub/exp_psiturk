class GenericPage extends Page {

    constructor() {
        super();
        this.showGeneric();

        this.full_screen_element = document.getElementById("full_screen_element");

        this.title = document.getElementById("generic_page_title");
        this.message = document.getElementById("generic_page_message");
        this.next_button = document.getElementById("generic_page_button");
    }

    setTitle(title, color) {
        this.title.innerHTML = title;
        if (color != null) {
            this.title.style.color = color;
        }
    }

    setMessage(message, color) {
        this.message.innerHTML = message;
        if (color != null) {
            this.message.style.color = color;
        }
    }

    setColorScheme(color_scheme) {
        if(color_scheme === Page.StatusError) {
            console.log("Setting color scheme for error.")
            this.title.style.color = "darkred";
            this.message.style.color = "black";
            this.next_button.className = "btn btn-danger btn-lg";
        } else if (color_scheme === Page.StatusSuccess) {
            console.log("Setting color scheme for success.")
            this.title.style.color = "darkgreen";
            this.message.style.color = "black";
            this.next_button.className = "btn btn-primary btn-lg";
        } else {
            console.log("Setting color scheme for generic categories.")
            this.title.style.color = "black";
            this.message.style.color = "black";
            this.next_button.className = "btn btn-primary btn-lg";
        }
    }

    setCallback(callback) {
        this.next_button.onclick = function() {
            console.log("INFO[ReturnToInstructions]: next button clicked.")
            callback();
        };
    }
}
