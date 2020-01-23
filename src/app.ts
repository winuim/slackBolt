import { App, LogLevel, subtype } from "@slack/bolt";
import * as store from "./store";
import { messages } from "./messages";
import * as helpers from "./helpers";

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

    say(messages.welcome_app_home);
  }
});

/**
  `reaction_added` event is triggered when a user adds a reaction to a message in a channel where the Bot User is part of
  https://api.slack.com/events/reaction_added
  We use this event to check if the added emoji (reactji) is a ⚡ (:zap:) emoji. If that's the case,
  a link to this message will be posted to the configured channel
**/
app.event("reaction_added", async ({ event, context, say }) => {
  // only react to ⚡ (:zap:) emoji
  if (event.reaction === "zap") {
    let channelId = "";
    if (helpers.hasProperty(event.item, "channel")) {
      if (typeof event.item.channel === "string") {
        channelId = event.item.channel;
      }
    }
    let ts = "";
    if (helpers.hasProperty(event.item, "ts")) {
      if (typeof event.item.ts === "string") {
        ts = event.item.ts;
      }
    }

    // get a permalink for this message
    const permalink = await app.client.chat.getPermalink({
      token: context.botToken,
      // eslint-disable-next-line @typescript-eslint/camelcase
      message_ts: ts,
      channel: channelId
    });

    // get user info of user who reacted to this message
    const user = await app.client.users.info({
      token: context.botToken,
      user: event.user
    });

    // formatting the user's name to mention that user in the message (see: https://api.slack.com/messaging/composing/formatting)
    let name = "";
    if (helpers.hasProperty(user.user, "id")) {
      name = "<@" + user.user.id + ">";
    }
    const channel = store.getChannel();

    // post this message to the configured channel
    await app.client.chat.postMessage({
      token: context.botToken,
      channel: channel && channel.id,
      text: name + " wants you to see this message: " + permalink.permalink,
      // eslint-disable-next-line @typescript-eslint/camelcase
      unfurl_links: true,
      // eslint-disable-next-line @typescript-eslint/camelcase
      unfurl_media: true
    });
  }
});

/**
  `member_joined_channel` event is triggered when a user joins public or private channels
  https://api.slack.com/events/member_joined_channel
  We use this event to introduce our App once it's added to a channel
**/
app.event("member_joined_channel", async ({ context, event, say }) => {
  const channel = store.getChannel();
  const user = event.user;

  // check if our Bot user itself is joining the channel
  if (user === store.getMe() && channel) {
    const message = helpers.copy(messages.welcome_channel);
    // fill in placeholder values with channel info
    message.blocks[0].text.text = message.blocks[0].text.text
      .replace("{{channelName}}", channel.name)
      .replace("{{channelId}}", channel.id);
    say(message);
  }
});

/**
  The action_id `configure_channel` is triggered when a user interacts with the welcome_app_home message (in messages.js) 
**/
app.action(
  // eslint-disable-next-line @typescript-eslint/camelcase
  { action_id: "configure_channel" },
  async ({ context, action, ack, respond }) => {
    ack();

    let channelId = "";
    if (helpers.hasProperty(action, "selected_channel")) {
      channelId = action.selected_channel;
    }

    // retrieve channel info
    const channelInfo = await app.client.channels.info({
      token: context.botToken,
      channel: channelId
    });

    let channelName = "";
    if (helpers.hasProperty(channelInfo.channel, "name")) {
      if (typeof channelInfo.channel.name === "string") {
        channelName = channelInfo.channel.name;
      }
    }

    // save the configured channel to our store
    store.setChannel({
      name: channelName,
      id: channelId
    });

    const message = helpers.copy(messages.channel_configured);
    // fill in placeholder values with channel info
    message.blocks[0].text.text = message.blocks[0].text.text
      .replace("{{channelId}}", channelId)
      .replace("{{channelName}}", channelName);
    respond(message);
  }
);

/**
  The action_id `add_to_channel` is triggered when a user interacts with the channel_configured message (in messages.js) 
**/
app.action(
  // eslint-disable-next-line @typescript-eslint/camelcase
  { action_id: "add_to_channel" },
  async ({ context, action, ack, say }) => {
    ack();

    let channelId = "";
    if (helpers.hasProperty(action, "selected_channel")) {
      channelId = action.selected_channel;
    }

    // retrieve channel info
    const channelInfo = await app.client.channels.info({
      token: context.botToken,
      channel: channelId
    });

    let channelName = "";
    if (helpers.hasProperty(channelInfo.channel, "name")) {
      if (typeof channelInfo.channel.name === "string") {
        channelName = channelInfo.channel.name;
      }
    }

    // invite Bot user to channel
    await app.client.channels.invite({
      token: context.userToken,
      channel: channelId,
      user: store.getMe()
    });

    const message = helpers.copy(messages.added_to_channel);
    // fill in placeholder values with channel info
    message.blocks[0].text.text = message.blocks[0].text.text
      .replace("{{channelId}}", channelId)
      .replace("{{channelName}}", channelName);
    say(message);
  }
);

// Listens to incoming messages that contain "hello"
app.message("hello", ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  say({
    text: "Hi,",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Hey there <@${message.user}>!`
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Click Me"
          },
          // eslint-disable-next-line @typescript-eslint/camelcase
          action_id: "button_click"
        }
      }
    ]
  });
});

app.action("button_click", ({ body, ack, say }) => {
  // Acknowledge the action
  ack();
  say(`<@${body.user.id}> clicked the button`);
});

// 特定の文字列、この場合 👋絵文字を含むメッセージと一致
app.message(":wave:", async ({ message, say }) => {
  say(`Hello, <@${message.user}>`);
});

app.message(/^(hi|hello|hey).*/, async ({ context, say }) => {
  // context.matches の内容が特定の正規表現と一致
  const greeting = context.matches[0];

  say(`${greeting}, how are you?`);
});

// "knock knock" を含むメッセージをリスニングし、 "who's there?" というメッセージをイタリック体で送信
app.message("knock knock", ({ message, say }) => {
  say("_Who's there?_");
});

app.event("app_mention", ({ event, say }) => {
  console.debug(event);
  say(`HELLO, <@${event.user}>`);
});

// bot からのメッセージ全てと一致
app.message(subtype("bot_message"), ({ message }) => {
  console.log(`The bot user ${message.user} said ${message.text}`);
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

  // after the app is started we are going to retrieve our Bot's user id through
  // the `auth.test` endpoint (https://api.slack.com/methods/auth.test)
  // and store it for future reference
  const id = await app.client.auth
    .test({ token: process.env.SLACK_BOT_TOKEN })
    .then(result => result.user_id);
  if (typeof id === "string") {
    store.setMe(id);
  }
})();
