import { bookmarklet } from "./utils.js";

async function serviceDesk() {
  let $notification = document.querySelector("#paper-status-notification");
  if (!$notification) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div id="paper-status-notification" style="position:fixed;top:20px;right:20px;padding:10px 20px;background-color:#333;color:#fff;font-family:Arial,sans-serif;font-size:14px;border-radius:5px;box-shadow:0 2px 10px rgba(0, 0, 0, 0.2);z-index:10000;opacity:0.9;"></div>`,
    );
    $notification = document.querySelector("#paper-status-notification");
  }
  const notify = (message) => ($notification.innerHTML = message);

  notify("Extracting Document ID...");
  const subject = document.querySelector(".details-left h1").textContent;
  const messages = [...document.querySelectorAll("[id^=notiDesc]")]
    .map((d) => d.innerText ?? d.shadowRoot?.querySelector("*")?.innerText)
    .filter((d) => d);

  fetch("https://llmfoundry.straive.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Extract the document ID from this text as JSON" },
        { role: "user", content: subject + "\n" + messages.join("\n") },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "math_reasoning",
          schema: {
            type: "object",
            properties: {
              docId: {
                type: "string",
              },
            },
            required: ["docId"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    }),
  })
    .then((r) => r.json())
    .then((response) => {
      const docId = JSON.parse(response.choices[0].message.content).docId;
      notify(`Getting history of Document: ${docId}...`);
      setTimeout(() => {
        const history = generateManuscriptHistory();
        notify("Drafting email response...");
        fetch("https://llmfoundry.straive.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a customer service agent. Reply to the user email based on the provided email history.

This is a dummy email for a demo. Make up realistic data for your reply as required. Ensure that the reply is realistic and will be realistic and believable.

Don't include a subject in your reply. Don't include the greeting or footer. Just the body of the email.`,
              },
              {
                role: "user",
                content: `
# User mail
Subject: ${subject}

${messages.join("\n")}

# Document History
${history.map((h) => `${h.date.toLocaleDateString()} - ${h.state}`).join("\n")}
`,
              },
            ],
          }),
        })
          .then((r) => r.json())
          .then((response) => {
            console.log(response);
            navigator.clipboard.writeText(response.choices[0].message.content);
            notify("Copied reply to clipboard!");
            $notification.style.transition = "opacity 2s";
            $notification.style.opacity = "0";
            setTimeout(() => $notification.remove(), 2000);
          });
      }, 1000);
    });

  const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function generateManuscriptHistory() {
    const history = [];
    let currentState = "Submitted";
    let currentDate = getRandomDate(new Date(2020, 0, 1), new Date());

    history.push({ date: currentDate, state: currentState });

    while (currentState !== "Accepted" && currentState !== "Rejected" && currentState !== "Published") {
      let possibleNextStates;

      switch (currentState) {
        case "Submitted":
          possibleNextStates = ["Under Review"];
          break;
        case "Under Review":
          possibleNextStates = ["Review Completed"];
          break;
        case "Review Completed":
          possibleNextStates = ["Accepted", "Rejected", "Major Revision Required", "Minor Revision Required"];
          break;
        case "Major Revision Required":
        case "Minor Revision Required":
          possibleNextStates = ["In Revision"];
          break;
        case "In Revision":
          possibleNextStates = ["Resubmitted"];
          break;
        case "Resubmitted":
          possibleNextStates = ["Under Review"];
          break;
        case "Accepted":
          possibleNextStates = ["In Production"];
          break;
        case "In Production":
          possibleNextStates = ["Published"];
          break;
        default:
          possibleNextStates = [];
          break;
      }

      if (possibleNextStates.length === 0 || Math.random() < 0.2) break;

      currentState = getRandomElement(possibleNextStates);
      currentDate = getRandomDate(currentDate, new Date());

      history.push({ date: currentDate, state: currentState });
    }

    return history;
  }
}

document.querySelector("#servicedesk-bookmarklet").href = await bookmarklet(serviceDesk);
