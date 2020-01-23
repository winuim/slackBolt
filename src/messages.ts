/* eslint-disable @typescript-eslint/camelcase */
import { SayArguments } from "@slack/bolt";

const messages: {
  [key: string]: SayArguments;
} = {
  welcome_app_home: {
    text:
      "こんにちは！ Boltは、 :zap: emojiを使用してメッセージに反応することにより、メッセージを別のチャネルに転送するシンプルなアプリです。",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            "こんにちは！ \n\n  Boltは、 :zap: emojiを使用してメッセージに反応することにより、メッセージを別のチャネルに転送するシンプルなアプリです。 \n\n ただし、開始する前に、すべてのメッセージを転送するチャンネルを設定しましょう。"
        }
      },
      {
        type: "divider"
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*ドロップダウンリストからチャンネルを選択します*"
        },
        accessory: {
          action_id: "configure_channel",
          type: "channels_select",
          placeholder: {
            type: "plain_text",
            text: "Select channel",
            emoji: true
          }
        }
      }
    ]
  },
  welcome_channel: {
    text:
      "こんにちは！ Boltは、 :zap: emojiを使用してメッセージに反応することにより、メッセージを別のチャネルに転送するシンプルなアプリです。",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            "こんにちは！ \n\n Boltは、 :zap: emojiを使用してメッセージに反応することにより、このチャンネルから <#{{channelId}}|{{channelName}}> にメッセージを転送するシンプルなアプリです。"
        }
      }
    ]
  },
  added_to_channel: {
    text: "Boltがチャンネルに招待されました",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            ":zap: Boltは *<#{{channelId}}|{{channelName}}>* に招待されました"
        }
      }
    ]
  },
  channel_configured: {
    text: "Boltのデフォルトチャネルが設定されました",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            ":tada: Boltのデフォルトチャネルは *<#{{channelId}}|{{channelName}}>* 用に構成されています"
        }
      },
      {
        type: "divider"
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            "任意のチャンネルで「/invite」と入力するか、下のドロップダウンからチャンネルを選択するだけで、Boltをチャンネルに招待できます。"
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Boltをチャンネルに招待する*"
        },
        accessory: {
          action_id: "add_to_channel",
          type: "channels_select",
          placeholder: {
            type: "plain_text",
            text: "Select channel",
            emoji: true
          }
        }
      }
    ]
  }
};

export { messages };
