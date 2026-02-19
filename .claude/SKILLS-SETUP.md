# Skills 安裝說明

在新電腦或新環境設置時，需要安裝以下 skills。

## 全域 Skills（所有專案共用，裝一次）

### Superpowers
```bash
cd ~ && git clone https://github.com/obra/superpowers.git .pm-skills/superpowers
```

### OpenSpec（CLI 工具）
```bash
npm install -g openspec
# 在每個使用 OpenSpec 的專案根目錄執行：
openspec init
```

## 專案 Skills（在 personal-site 專案根目錄執行）

### Vercel React Best Practices
```bash
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices
```

### UI/UX Pro Max
```bash
npx skills add https://github.com/nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max
```

## 確認安裝完成

```bash
# 確認 superpowers 在正確位置
ls ~/.pm-skills/superpowers/skills/brainstorming/SKILL.md

# 確認專案 skills 安裝成功
ls .claude/skills/vercel-react-best-practices/SKILL.md
ls .claude/skills/ui-ux-pro-max/SKILL.md

# 確認 OpenSpec 指令可用（在 Claude Code 中）
# 輸入 /opsx: 應該會出現指令補全
```

## Skills 分工說明

| Skill | 安裝位置 | 哪些 Agent 用 |
|-------|---------|-------------|
| `superpowers:brainstorming` | `~/.pm-skills/` | pm |
| `superpowers:writing-plans` | `~/.pm-skills/` | pm, tpm, architect |
| `superpowers:executing-plans` | `~/.pm-skills/` | tpm |
| `superpowers:verification-before-completion` | `~/.pm-skills/` | architect, frontend |
| OpenSpec (`/opsx:*`) | CLI 工具 | pm, tpm, architect |
| `vercel-react-best-practices` | `.claude/skills/` | architect, frontend |
| `ui-ux-pro-max` | `.claude/skills/` | frontend |
| `agent-lifecycle` | `.claude/skills/` | 所有 agent |
| `code-marking` | `.claude/skills/` | frontend |
