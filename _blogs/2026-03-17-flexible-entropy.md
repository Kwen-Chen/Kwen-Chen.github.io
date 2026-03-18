---
layout: blog
title: '如何在大模型RL中灵活地控制熵'
date: 2026-03-17
permalink: /posts/2026/03/flexible-entropy/
tags:
  - LLM
  - RLVR
  - Entropy
lang: zh
lang_pair: /posts/2026/03/flexible-entropy-en/
---


> 本文介绍我们近期在 RLVR 训练动态方面的一项研究。我们从梯度保留裁剪（Gradient-Preserving Clipping）的理论视角出发，提出了一套灵活的熵调节机制，并基于熵增熵减的调节机制，实验了包括先熵增再熵减，熵减-熵增-熵减和动态衰减的三种熵控制策略，通过实验证明，该策略有效缓解了 GRPO 训练中的策略熵崩溃问题。

---

论文：Flexible Entropy Control in RLVR with Gradient-Preserving Perspective

论文链接：[http://arxiv.org/abs/2602.09782](http://arxiv.org/abs/2602.09782)



## 一、背景：当大模型学会"过早自信"

近年来，以 DeepSeek-R1 为代表的大语言模型在通过 RLVR 在数学推理、代码生成等任务上取得了惊人进展。作为 RLVR 的代表算法，**GRPO** 因其无需单独训练 Critic 网络、实现简单高效而被广泛采用。然而，一个普遍困扰研究者的现象是：**随着训练进行，模型的策略熵会迅速衰减至接近零，也就是熵崩溃**。

### 什么是策略熵崩溃？

策略熵衡量的是模型输出的"不确定性"或"多样性"。高熵意味着模型会探索多种可能的解题路径，低熵则意味着模型变得"过于自信"，倾向于重复少数几种固定模式。

<img src="https://imgtable.oss-cn-chengdu.aliyuncs.com/img/entropy_gradnorm_plot.png" alt="训练过程中的熵与梯度范数变化" style="zoom:15%;" />

*图 1：GRPO 训练过程中，策略熵迅速衰减（熵崩溃)，同时梯度范数被熵上界所限制*

然后GRPO训练往往会出现熵的迅速衰减，也就是熵崩溃，熵崩溃带来两个严重后果：

1. **过早收敛**：模型在训练早期就锁定少数"看似有效"的解题策略，丧失探索能力，陷入局部最优
2. **梯度消失**：Shen 等人的理论分析表明，策略梯度范数受熵的上界约束，熵崩溃直接导致后续训练梯度微弱，模型难以继续改进

---

## 二、问题的根源：梯度裁剪的双刃剑

要理解熵崩溃，我们需要回到 RLVR 的核心机制——**PPO-Clip 的梯度裁剪**。

### PPO-Clip 回顾

PPO（Proximal Policy Optimization）通过限制新旧策略之间的偏离程度来稳定训练：

$$
r_t(\theta) = \frac{\pi_\theta(a_t|s_t)}{\pi_{\text{old}}(a_t|s_t)}
$$

其中 $r_t(\theta)$ 是重要性采样比率。PPO-Clip 的目标函数为：

$$
L^{C}(\theta) = \hat{\mathbb{E}}_t \left[ \min \left( r_t(\theta)\hat{A}_t, \text{clip}(r_t(\theta), 1-\epsilon, 1+\epsilon)\hat{A}_t \right) \right]
$$

通过将 $r_t(\theta)$ 裁剪在 $[1-\epsilon, 1+\epsilon]$ 区间内，PPO 确保策略更新不会过于激进。

### 裁剪阈值与熵的微妙关系

现有研究（如 DAPO）发现，**过于严格的裁剪阈值会抑制低概率 token 的探索**，导致熵持续下降。DAPO 提出的 **Clip-Higher** 策略通过提高上界阈值 $\epsilon_{high}$ 来缓解这一问题。

然而，究竟梯度裁剪与熵控制之间存在什么关系，能否通过梯度裁剪来准确灵活控制熵增熵减，以及我们究竟在训练中应该如何有效地控制熵仍然是需要解决的问题。我们的核心贡献就在回答上面这三个问题。

## 三、理论分析：四个熵敏感区域

我们的贡献之一是从理论上精确刻画了重要性采样比率空间中，哪些区域会促进熵增长，哪些区域会导致熵下降。我们发现，关于这一讨论，我们和 通义团队近期的工作 [On the Entropy Dynamics in Reinforcement Fine-Tuning of Large Language Models](https://arxiv.org/abs/2602.03392) 不谋而和。在他们的知乎介绍中 [RL训练中的 Entropy Dynamics](https://zhuanlan.zhihu.com/p/2004633029096776871) 也有对这一理论和其他工作的介绍。

### 核心推导

对于单步更新的 surrogate objective：

$$
L(\theta) = \frac{\pi_\theta(a|s)}{\pi_{\text{old}}(a|s)} \hat{A}
$$

我们计算目标函数梯度与全局熵梯度的内积：

$$
\langle \nabla_z L, \nabla_z H \rangle \propto -\hat{A} \left[ p_a(\ln p_a + H) - \sum_{x \in V} p_x^2 (\ln p_x + H) \right]
$$

式子中的两项分别为 Token-specific 项和 Global baseline 项，而这一内积的符号主要由相对于基线的词特定token项决定。聚焦于特定 token的成分，我们得到以下关系：
$$
\langle \nabla_z L, \nabla_z H \rangle \propto -\hat{A} \left[ p_a(\ln p_a + H)\right]
$$


由此得到关键洞察：**熵的变化方向取决于 token 的"惊奇度"（Surprisal）与当前熵的相对关系**。

### 四个熵敏感区域

基于理论分析，我们识别出四个关键区域：

| 区域 | 条件 | 优势 $A$ | 熵变化 |
|:---:|:---:|:---:|:---:|
| **E1** | $-\ln \pi(a\|s) < H$（低惊奇度/高概率） | $A > 0$ | **下降** |
| **E2** | $-\ln \pi(a\|s) > H$（高惊奇度/低概率） | $A > 0$ | **上升** |
| **E3** | $-\ln \pi(a\|s) < H$（低惊奇度/高概率） | $A < 0$ | **上升** |
| **E4** | $-\ln \pi(a\|s) > H$（高惊奇度/低概率） | $A < 0$ | **下降** |

<img src="https://imgtable.oss-cn-chengdu.aliyuncs.com/img/clip_and_quadrant_combined.png" alt="四个熵敏感区域的可视化" style="zoom:14%;" />

*图 2：PPO clip 示意图以及四个区域示意图*

**直观理解**：
- **E1/E4**：强化"意料之中"的 token → 分布更尖锐 → 熵下降
- **E2/E3**：强化"出乎意料"的 token → 分布更平坦 → 熵上升

我们通过受控实验验证了这一理论：仅对特定区域应用梯度裁剪，观察到与理论预测完全一致的熵动态变化。

<img src="https://imgtable.oss-cn-chengdu.aliyuncs.com/img/entropy_dynamics_stacked.png" alt="熵动态实验结果" style="zoom:15%;" />

*图 3：四个区域的熵动态实验结果。E1/E4 导致熵下降，E2/E3 导致熵上升*

---

## 四、熵的调节机制：动态裁剪阈值

基于上述理论洞察，我们设计了**动态裁剪阈值机制**，通过非线性调制特定比率区域来精确控制熵。

### 4.1 动态上界裁剪阈值（控制熵增）

当 $A > 0$ 时，上界阈值主要影响 E1（高概率）和 E2（低概率）区域。

固定的高阈值（例如DAPO的 clip-higher）虽然能促进 E2 区域的探索，但同时也会引入 E1 区域的过优化，导致熵下降。我们为了避免这种情况出现，将上界阈值 $\epsilon$ 设计为当前概率的函数：

$$
\epsilon(\pi_\theta) := f(\pi_\theta(a_t|s_t))
$$

其中 $f$ 与 $\pi_\theta$ 呈**负相关**：
- **低概率 token**：放宽阈值，促进探索（增强 E2）
- **高概率 token**：收紧阈值，防止过优化（抑制 E1）

采用线性负相关形式 $\epsilon(\pi_\theta) = \alpha \cdot \pi_\theta + \beta$，得到动态约束：

$$
\pi_\theta(a_t|s_t) \le \frac{1+\beta}{1-\alpha \cdot \pi_{\theta_{\text{old}}}(a_t|s_t)} \cdot \pi_{\theta_{\text{old}}}(a_t|s_t)
$$

<img src="https://imgtable.oss-cn-chengdu.aliyuncs.com/img/upper_combined.png" alt="动态上界裁剪阈值示意图" style="zoom:15%;" />

*图 4：动态上界裁剪阈值。低概率区域阈值高于基准，高概率区域阈值低于基准*

### 4.2 动态下界裁剪阈值（控制熵减）

当 $A < 0$ 时，情况更为微妙。负优势信号存在一个**不稳定性问题**：由于 Softmax 的归一化特性，惩罚某个 token 会间接提升其他所有 token 的概率。对于 **高概率负样本**，固定的高 $\epsilon_{low}$ 允许过度更新，导致分布剧烈偏移 而 对于 **低概率负样本**：进一步压低其概率有助于排除次优区域，且对整体分布影响有限。

因此，我们采用相反的动态策略：
- **高概率 token**：收紧阈值，保持稳定性（抑制 E3 的过度熵增）
- **低概率 token**：放宽阈值，强化排除（增强 E4 的熵减效果）

<img src="https://imgtable.oss-cn-chengdu.aliyuncs.com/img/lower_combined.png" alt="动态下界裁剪阈值与实验曲线" style="zoom:15%;" />

*图 5：动态下界裁剪阈值（左）及其实验效果（右）。低概率区域阈值高于基准，高概率区域阈值低于基准，有效促进熵下降*

---

## 五、熵的控制策略：探索与收敛的平衡

有了动态裁剪机制，我们可以设计灵活的熵控制策略。核心思想是：**训练早期保持高熵以促进探索，后期逐渐降低熵以实现收敛**。

我们将 PPO 裁剪目标函数推广为时间依赖形式：

$$
L^{CLIP}_k(\theta) = \hat{\mathbb{E}} \left[ \frac{1}{G} \sum_{t=1}^G \min \left( r_t(\theta) A_t, \text{clip}\left(r_t(\theta), 1-\mathcal{E}^-_k(p_t), 1+\mathcal{E}^+_k(p_t)\right) A_t \right) \right]
$$

其中 $\mathcal{E}^+_k$ 和 $\mathcal{E}^-_k$ 是随训练步数 $k$ 动态变化的阈值函数。

### 策略一：Increase-then-Decrease（ID）

以训练总步数 $T$ 的中点为界，分为两个阶段：

$$
\mathcal{E}^+_{k-ID}(p), \mathcal{E}^-_{k-ID}(p) = 
\begin{cases} 
\lambda_k \cdot \mathcal{H}(p) + (1-\lambda_k) \cdot \epsilon_{std}, \quad \epsilon_{std} & 0 \le k \le \frac{T}{2} \\
\epsilon_{std},\quad (1+\lambda_k)\cdot \mathcal{M}(p)-\lambda_k\cdot \epsilon_{std} & \frac{T}{2} < k \le T
\end{cases}
$$

其中 $\lambda(k) = 1 - \frac{2k}{T}$，$\mathcal{H}(p)$ 是动态上界函数，$\mathcal{M}(p)$ 是动态下界函数。

- **第一阶段**：使用动态上界促进熵增长，下界保持标准值
- **第二阶段**：上界恢复标准值，使用动态下界促进熵下降

![ID 策略示意图](https://imgtable.oss-cn-chengdu.aliyuncs.com/img/ID-crop.png)

*图 6：ID 策略的两阶段熵控制示意图*

### 策略二：Decrease-Increase-Decrease（DID）

DID 策略允许熵在第一阶段先下降，在熵崩溃前通过梯度裁剪控制熵的回升，然后在第二阶段收敛：

$$
\mathcal{E}^+_{k-DID}(p), \mathcal{E}^-_{k-DID}(p) =
\begin{cases} 
\lambda_k \cdot \epsilon_{std} + (1-\lambda_k) \cdot \mathcal{H}(p), \quad \epsilon_{std} & 0 \le k \le \frac{T}{2} \\
\mathcal{H}(p),\quad (1+\lambda_k)\cdot \mathcal{M}(p)-\lambda_k\cdot \epsilon_{std} & \frac{T}{2} < k \le T
\end{cases}
$$

![DID 策略示意图](https://imgtable.oss-cn-chengdu.aliyuncs.com/img/DID-crop.png)

*图 7：DID 策略的三阶段熵控制示意图*

### 策略三：Oscillatory Decay（OD）

ID 和 DID 都将训练过程划分为离散阶段。OD 策略则让模型在整个训练过程中自主进行振荡衰减：

定义随时间变化的熵阈值：

$$
\begin{aligned}
\tau_{low} &= H_{min} \\
\tau_{high}(t) &= H_{min} + (H_{init} - H_{min}) \cdot \left(1 - \frac{t}{T}\right)
\end{aligned}
$$

其中 $H_{min} = 0.2 H_{init}$ 是目标熵下界。

引入离散状态变量 $s_k \in \{0, 1\}$（1 表示熵增模式，0 表示熵减模式），通过滞环逻辑控制状态转移：

$$
s_k = \begin{cases} 
1 & \text{if } H(\pi_t) \le \tau_{low} \quad (\text{触发提升}) \\
0 & \text{if } H(\pi_t) > \tau_{high}(k) \quad (\text{触发抑制})
\end{cases}
$$

根据当前状态动态选择裁剪阈值：

$$
\mathcal{E}^+_k(p), \mathcal{E}^-_k(p) = 
\begin{cases} 
\mathcal{H}(p), \quad \epsilon_{std} & \text{if } s_k = 1 \\
\epsilon_{std}, \quad \mathcal{M}(p) & \text{if } s_k = 0
\end{cases}
$$

---

## 六、实验结果

我们在 Qwen2.5-Math-7B 和 Qwen2.5-7B 上进行了全面实验，使用 DAPO-MATH 数据集，在 AIME24、AIME25、AMC、MATH-500、GSM8K、Olympiad 等基准上评估。

我们的三种策略在多个基准上均优于 GRPO ， Clip-Higher 和其他基线方法，其中 **ID 策略在 AIME24、AMC、MATH-500、GSM8K、Olympiad 上取得最佳性能**。具体的实验结果大家可以见论文。

### 熵与奖励曲线分析

![训练过程中的熵与奖励曲线](https://imgtable.oss-cn-chengdu.aliyuncs.com/img/exp-results-1.png)

*图 8：各方法在 Qwen2.5-Math-7B 上的训练动态*

从训练曲线可以观察到：
1. **熵调控有效**：三种策略都实现了预期的熵变化模式
2. **后期性能超越**：虽然早期奖励较低，但我们的方法在后期显著超越基线

### 探索能力评估

![Pass@K 指标对比](https://imgtable.oss-cn-chengdu.aliyuncs.com/img/pass_at_k.png)

*图 9：训练中期（120 步)各方法的 Pass@K 性能*

我们使用 Pass@K 指标评估模型的探索能力，在模型训练熵较高的 120 step。结果显示，虽然各方法在 Pass@1 上表现相近，但**增加采样数后，我们的方法展现出显著更好的 Pass@K 性能**，说明模型保留了更丰富的解题策略。

### 阶段比例分析

对于 ID 和 DID 策略，我们分析了不同阶段比例的影响：

![不同阶段比例的对比](https://imgtable.oss-cn-chengdu.aliyuncs.com/img/time_radio.png)

*图 10：不同第一阶段比例（0.3、0.4、0.5、0.6)下的熵与验证集得分曲线*

结果表明，**0.5 的均衡比例取得最优性能**：
- 比例过小（0.3/0.4）：熵尚未达到足够峰值就开始下降
- 比例过大（0.6）：第二阶段收敛过快，影响最终性能

---

## 七、总结、其余实验分析与展望

本文从梯度保留裁剪的理论视角出发，系统研究了 RLVR 中的策略熵控制问题。我们的主要贡献包括：

1. **理论洞察**：精确刻画了重要性采样比率空间中四个熵敏感区域的作用机制
2. **调控机制**：设计了基于动态裁剪阈值的熵调控方法，可独立控制熵增和熵减
3. **控制策略**：提出了 ID、DID、OD 三种熵控制策略，有效缓解熵崩溃并提升模型性能

此外，其余深入的实验分析（裁剪阈值关联、Token 裁剪概率、与固定阈值方法的对比）欢迎从我们在 Arxiv 上发布的论文继续了解，我们验证了动态裁剪机制的有效性和必要性。

这项工作为理解和控制大模型强化学习中的训练动态提供了新的理论工具和实用方法。未来，我们计划探索更精细的自适应熵控制机制，以及将这一框架扩展到更广泛的 RLVR 应用场景。

---

## 参考文献

[1] Shen et al. "On Entropy Control in LLM-RL Algorithms." 2025

[2] Schulman et al. "Proximal Policy Optimization Algorithms." arXiv:1707.06347

[3] Yu et al. "DAPO: An Open-Source LLM Reinforcement Learning System at Scale." arXiv:2503.14476

[4] Wang et al. “On the Entropy Dynamics in Reinforcement Fine-Tuning of Large Language Models”. arXiv:2602.03392





---

*本文基于我们投稿的工作 "Flexible Entropy Control in RLVR with Gradient-Preserving Perspective"。如有问题或合作意向，欢迎联系交流。*
