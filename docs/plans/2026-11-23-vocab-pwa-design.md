# 日常词汇学习 PWA — 设计文档

日期：2026-11-23

## 目标

帮助在北美生活多年的中文母语者补齐日常基础词汇（家具、水果、汽车部件等）。
解决两个痛点：

1. 看到东西叫不出英文名。
2. 听到单词反应不过来是什么东西。

## 关键决策

| 项目 | 决策 |
|---|---|
| 形态 | 手机优先的 PWA，可添加到主屏幕，离线可用 |
| 英语变体 | 美式为主，英式差异以「UK: xxx」标注 |
| 图片 | Wikimedia Commons 真实照片，经 Wikidata P18 属性获取，预先下载打包 |
| 发音 | 浏览器 Web Speech API（en-US） |
| 存储 | IndexedDB，本地保存，无账号无后端 |
| 部署 | GitHub Pages（GitHub Actions 自动构建） |
| 技术栈 | Vite + React + TypeScript + vite-plugin-pwa，Vitest 测试 |

## 词库

约 33 个主题，每个 30–50 词，共约 1200–1500 词。

- 家居：客厅家具、卧室、厨房电器、厨具餐具、浴室、洗衣清洁用品、家用电器、房屋结构、花园院子
- 食物：水果、蔬菜、肉类海鲜、调料香料、面包早餐、乳制品饮料、超市包装
- 汽车出行：汽车外部、汽车内饰仪表盘、汽车保养加油站、道路交通
- 人：身体部位、症状药店、衣服、鞋帽配饰、个人护理洗漱
- 工具：五金工具、螺丝钉紧固件、文具办公
- 场所：城市场所、医院诊所、银行邮局
- 其他：常见动物、鸟虫、天气自然、运动器材、婴儿用品、宠物用品、电子数码线材

每个词条字段：

```ts
interface Word {
  id: string;          // "fruit.apple"
  en: string;          // 美式写法
  uk?: string;         // 英式差异
  ipa: string;
  zh: string;
  example: string;
  wikidataId?: string; // 如 "Q89"
  image?: string;      // 构建后填充的本地路径
  credit?: string;     // 图片作者/许可
}
```

## 学习模式

1. **浏览**：逐张卡片，自动发音，标记「认识/不认识」。
2. **闪卡**：正面图片（可切换为英文），翻面显示单词、音标、发音、中文、例句；
   自评 Again / Hard / Good / Easy，直接驱动 SRS。
3. **看图选词 → 拼写**：4 选 1；熟练后升级为键盘拼写。
4. **听音选图**：只播发音，4 张图选 1。
5. **每日复习**：到期词汇，可选「闪卡」或「测验」形式，共享进度。

干扰项从同一主题抽取。

## 间隔重复

简化 SM-2：

- 每词状态：`ease`（默认 2.5）、`interval`（天）、`reps`、`due`。
- Again：reps=0，interval=1（当天再出现），ease −0.2（下限 1.3）。
- Hard：interval×1.2，ease −0.15。
- Good：首次 1 天、第二次 3 天，之后 interval×ease。
- Easy：在 Good 基础上 ×1.3，ease +0.15。
- 测验答对视为 Good，答错视为 Again。

## 页面

- 首页：今日待复习数、复习方式选择、主题网格（掌握进度条）、连续打卡天数。
- 主题页：词表 + 进入浏览/闪卡/测验。
- 闪卡页、测验页、复习页、设置页（闪卡方向、导出/导入进度 JSON）。

## 结构

```
data/topics/*.json
scripts/fetch-images.ts   # Wikidata → 下载 → 压缩为 WebP(~30KB) → 写入 credit
public/images/
src/lib/srs.ts            # 纯函数，单元测试
src/lib/quiz.ts           # 出题与干扰项，单元测试
src/lib/storage.ts        # IndexedDB
src/lib/speech.ts
src/pages/  src/components/
```

## 错误处理

- 无图词条：脚本输出清单人工补充；仍缺失时卡片以中文释义代替图片。
- 设备无 en-US 语音：隐藏发音按钮并在设置页提示。
- 图片署名显示在卡片底部。

## 测试

- Vitest：SRS 调度、出题逻辑、数据文件校验（字段完整、id 唯一、每主题 ≥4 词）。
- 手动：iPhone Safari 添加到主屏幕、离线访问。

## 不做（YAGNI）

账号、云同步、语音识别评分、排行榜、自定义添加词汇。
