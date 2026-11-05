# 首页与课程区调整

本次根据最新两张标注图修改：

- 首页移除 Explore courses、Different people. Shared purpose. / A place for all of us. 及 Scroll to discover 提示。
- 首页 Start learning 改为平滑下滑到课程区，不改变当前学习页面或学习进度。
- 课程区右上增加 Back to homepage，点击平滑返回首页顶部。
- 三张课程卡片的按钮文字放大到 16px，状态文字放大到 13px。
- 角色扮演按钮移到 A new perspective starts with you. 标题旁边；窄屏可自然换行。
- 保留三个模块、视频文件、顺序解锁、角色扮演和反思提交流程。

## 使用

解压后打开 V2/index.html 查看。需要原本地 AI 服务时，进入 V2 文件夹按原方式运行 node serve.mjs。三个模块和原有全部素材都包含在此完整代码包中。

## 修改文件

- index.html：删除标注内容、调整按钮位置和滚动标记。
- belong-redesign.css：字体、间距、课程区高度及手机适配。
- belong-redesign.js：首页与课程区之间的滚动、焦点处理；沿用系统减少动态效果偏好。

## 验证范围

实际浏览器验证：首页 Start learning 保持在 #13:2，并将课程区滚到视口上方约 24px 处；Back to homepage 返回页面顶部。三个课程按钮字体均为 16px。角色扮演解锁后的按钮与标题相邻，间隔 28px，点击可进入原角色扮演介绍页。

已检查 1440×900、390×844 和 320×640 布局，课程卡片、返回按钮和角色扮演按钮没有横向溢出。全部 25 个页面标识与跳转目标有效，本地素材完整。

本次未重新完整观看所有视频或调用 AI 服务。app.js、learning-state.js 和视频文件不属于本次修改范围。
