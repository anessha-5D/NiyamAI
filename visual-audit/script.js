
const imageUpload = document.getElementById("imageUpload");
const imagePreview = document.getElementById("imagePreview");
const creativeDetails = document.getElementById("creativeDetails");

function setDetail(id, value) {
    document.getElementById(id).textContent = value;
}

function getGCD(a, b) {
    while (b !== 0) {
        const remainder = a % b;
        a = b;
        b = remainder;
    }
    return a;
}

imageUpload.addEventListener("change", function () {
    const file = this.files[0];

    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
        alert("Please choose a PNG, JPG, or WEBP image.");
        this.value = "";
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert("Please choose an image smaller than 10 MB.");
        this.value = "";
        return;
    }

    creativeDetails.hidden = false;

    setDetail("detailFileName", file.name);
    setDetail("detailFormat", file.type.split("/")[1].toUpperCase());
    setDetail(
        "detailFileSize",
        file.size < 1024 * 1024
            ? (file.size / 1024).toFixed(1) + " KB"
            : (file.size / (1024 * 1024)).toFixed(2) + " MB"
    );
    setDetail("detailDimensions", "Reading image...");
    setDetail("detailAspectRatio", "Reading image...");
    setDetail("detailStatus", "Loading image...");

    const imageURL = URL.createObjectURL(file);
    const image = new Image();

    image.onload = function () {
        const width = image.naturalWidth;
        const height = image.naturalHeight;
        const gcd = getGCD(width, height);

        imagePreview.replaceChildren();
        image.alt = "Preview of " + file.name;
        imagePreview.appendChild(image);

        const details = document.createElement("p");
        details.innerHTML =
            "<strong>File:</strong> " + escapeHTML(file.name) + "<br>" +
            "<strong>Dimensions:</strong> " + width + " × " + height + " px<br>" +
            "<strong>File size:</strong> " + (file.size / 1024).toFixed(1) + " KB";

        imagePreview.appendChild(details);

        setDetail("detailDimensions", width + " × " + height + " px");
        setDetail("detailAspectRatio", (width / gcd) + ":" + (height / gcd));
        setDetail("detailStatus", "Image loaded successfully");

        URL.revokeObjectURL(imageURL);
    };

    image.onerror = function () {
        URL.revokeObjectURL(imageURL);
        setDetail("detailStatus", "Could not load image");
        alert("Could not preview this image. Please try another.");
    };

    image.src = imageURL;
});

function escapeHTML(value) {
    return value.replace(/[&<>"']/g, function (character) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[character];
    });
}


// Alt-text review: a basic presence and length check
document.getElementById("checkAltText").addEventListener("click", function () {
    const text = document.getElementById("altText").value.trim();
    const result = document.getElementById("altTextResult");

    if (!text) {
        result.textContent =
            "Warning: Add a description explaining the important information in your image.";
    } else if (text.length < 10) {
        result.textContent =
            "Needs review: This description may be too short to communicate the image's purpose.";
    } else {
        result.textContent =
            "Description added. Please review whether it accurately describes the image's important information.";
    }
});

// Calculate relative luminance for contrast checking
function getLuminance(hex) {
    const rgb = hex.match(/[0-9a-f]{2}/gi).map(value => {
        let channel = parseInt(value, 16) / 255;

        return channel <= 0.04045
            ? channel / 12.92
            : Math.pow((channel + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

document.getElementById("checkContrast").addEventListener("click", function () {
    const textColor = document.getElementById("textColor").value;
    const backgroundColor = document.getElementById("backgroundColor").value;

    const first = getLuminance(textColor);
    const second = getLuminance(backgroundColor);

    const lighter = Math.max(first, second);
    const darker = Math.min(first, second);
    const ratio = (lighter + 0.05) / (darker + 0.05);

    const passesNormal = ratio >= 4.5;
    const passesLarge = ratio >= 3;

    let message = "Contrast ratio: " + ratio.toFixed(2) + ":1. ";

    if (passesNormal) {
        message += "Passes the WCAG AA contrast threshold for normal text.";
    } else if (passesLarge) {
        message += "Passes for large text, but not normal text under WCAG AA.";
    } else {
        message += "Does not meet the WCAG AA contrast threshold for normal or large text.";
    }

    document.getElementById("contrastResult").textContent = message;
});

// Local privacy check for common email addresses and phone numbers
document.getElementById("maskPrivacy").addEventListener("click", function () {
    const original = document.getElementById("privacyText").value;

    const masked = original
        .replace(
            /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
            "[EMAIL MASKED]"
        )
        .replace(
            /(?<!\w)(?:\+?\d[\d\s().-]{7,}\d)(?!\w)/g,
            "[PHONE MASKED]"
        );

    document.getElementById("maskedText").textContent = original.trim()
        ? masked
        : "Please enter some text to review first.";

    document.getElementById("copyStatus").textContent = "";
});

// Copy masked text
document.getElementById("copyMasked").addEventListener("click", async function () {
    const text = document.getElementById("maskedText").textContent;
    const status = document.getElementById("copyStatus");

    if (
        !text ||
        text === "Your masked text will appear here." ||
        text === "Please enter some text to review first."
    ) {
        status.textContent = "Generate a masked preview first.";
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        status.textContent = "Masked text copied.";
    } catch {
        status.textContent =
            "Copy unavailable. Select the masked text and copy it manually.";
    }
});

