// SpeakSoftly, a Vencord userplugin
// Copyright (c) 2026 LaykaTheWuffinator
// SPDX-License-Identifier: GPL-3.0-or-later

import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";
import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { ContextMenuApi, Menu } from "@webpack/common";

const settings = definePluginSettings({
    enabled: {
        type: OptionType.BOOLEAN,
        description: "Prefix outgoing messages with `-# ` (subtext)",
        default: false,
        hidden: true
    }
});

function SpeakSoftlyIcon({ enabled = true }: { enabled?: boolean; }) {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" style={{ scale: "1" }}>
            <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"
            />
            {!enabled && (
                <path
                    stroke="var(--status-danger)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    d="M3 21 21 3"
                />
            )}
        </svg>
    );
}

function SpeakSoftlyMenu() {
    const { enabled } = settings.use(["enabled"]);

    return (
        <Menu.Menu
            navId="vc-speak-softly"
            onClose={ContextMenuApi.closeContextMenu}
            aria-label="Speak Softly"
        >
            <Menu.MenuCheckboxItem
                id="vc-speak-softly-enabled"
                label="Speak softly"
                checked={enabled}
                action={() => { settings.store.enabled = !settings.store.enabled; }}
            />
        </Menu.Menu>
    );
}

const SpeakSoftlyButton: ChatBarButtonFactory = ({ isMainChat }) => {
    const { enabled } = settings.use(["enabled"]);

    if (!isMainChat) return null;

    return (
        <ChatBarButton
            tooltip={enabled ? "Speaking softly (right-click to turn off)" : "Speak softly (right-click to turn on)"}
            onClick={e => ContextMenuApi.openContextMenu(e, () => <SpeakSoftlyMenu />)}
            onContextMenu={e => {
                e.preventDefault();
                settings.store.enabled = !settings.store.enabled;
            }}
        >
            <SpeakSoftlyIcon enabled={enabled} />
        </ChatBarButton>
    );
};

const PREFIX = "-# "; // note the trailing space, Discord requires it

function soften(content: string) {
    // Subtext only works at the start of a line, and wrapping code blocks would break them
    if (content.includes("```")) return content;

    return content
        .split("\n")
        .map(line => (line.trim() === "" || line.startsWith(PREFIX)) ? line : PREFIX + line)
        .join("\n");
}

export default definePlugin({
    name: "SpeakSoftly",
    description: "Toggle that automatically turns your messages into subtext (-# )",
    authors: [{ name: "layka", id: 373556354230648832n }],
    settings,

    chatBarButton: {
        icon: SpeakSoftlyIcon,
        render: SpeakSoftlyButton
    },

    onBeforeMessageSend(_channelId, msg) {
        if (!settings.store.enabled || !msg.content) return;
        msg.content = soften(msg.content);
    }
});
