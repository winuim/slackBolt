import { App, LogLevel } from "@slack/bolt";
import * as store from "./store";

const app = new App({
  // using the `authorize` function instead of the `token` property
  // to make use of both user and bot tokens
  authorize: () => {
    return Promise.resolve({
      botToken: process.env.SLACK_BOT_TOKEN,
      userToken: process.env.SLACK_USER_TOKEN
    });
  },
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  // setting `ignoreSelf` to `false` to also retrieve events from our Bot user
  // e.g. we want to know when our Bot users is added to a channel through the
  // `member_joined_channel` event
  ignoreSelf: false,
  logLevel: LogLevel.DEBUG
});

/**

`app_home_opened` event is triggered when a user has entered into the App Home space (= Bot User DM)

https://api.slack.com/events/app_home_opened

We use this event to show the user an interactive welcome message once they open a DM with our App
to let them configure our App and let them choose a default channel to post messages to

**/
app.event("app_home_opened", ({ event, say }) => {
  // Look up the user from DB
  let user = store.getUser(event.user);

  if (!user) {
    user = {
      user: event.user,
      channel: event.channel
    };
    store.addUser(user);

    say(`Hello world, and welcome <@${event.user}>!`);
  } else {
    say("Hi again!");
  }
});

// Listens to incoming messages that contain "hello"
app.message("hello", ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  say(`Hey there <@${message.user}>!`);
});

// 特定の文字列、この場合 👋絵文字を含むメッセージと一致
app.message(":wave:", async ({ message, say }) => {
  say(`Hello, <@${message.user}>`);
});

// "knock knock" を含むメッセージをリスニングし、 "who's there?" というメッセージをイタリック体で送信
app.message("knock knock", ({ message, say }) => {
  say("_Who's there?_");
});

// Listens to incoming messages that contain "ping"
app.message("ping", ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  say("pong");
});

// この echo コマンドは 単純にコマンドをエコー（こだま）
app.command("/echo", async ({ command, ack, say }) => {
  // コマンドリクエストを確認
  ack();
  say(`${command.text}`);
});

app.error(error => {
  // Check the details of the error to handle cases where you should retry sending a message or stop the app
  console.error(error);
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
