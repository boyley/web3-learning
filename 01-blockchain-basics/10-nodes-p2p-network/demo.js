// 10 · 节点与 P2P 网络 · 八卦传播(gossip)demo —— 纯 Node，无需联网 / 钱包 / 第三方库
// 运行：node demo.js
//
// 目标：模拟一条交易/新区块如何在没有中心服务器的 P2P 网络里，
//       靠节点「收到就转发给邻居」的方式，一跳一跳传遍全网(gossip 协议)。

// 构造一个随机连接的节点网络（无向图）：每个节点认识若干「邻居」
function buildNetwork(n, avgPeers = 2) {
  const nodes = Array.from({ length: n }, (_, i) => ({ id: i, peers: new Set(), seen: false }));
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < avgPeers; k++) {
      const j = Math.floor(Math.random() * n);
      if (j !== i) {
        nodes[i].peers.add(j); // 互加为邻居
        nodes[j].peers.add(i);
      }
    }
  }
  // 保证连通：把节点串成一条环，避免有孤岛
  for (let i = 0; i < n; i++) {
    nodes[i].peers.add((i + 1) % n);
    nodes[(i + 1) % n].peers.add(i);
  }
  return nodes;
}

// 八卦传播：从 source 节点开始广播一条消息，逐跳(round)扩散
function gossip(nodes, source) {
  nodes.forEach((nd) => (nd.seen = false));
  nodes[source].seen = true;
  let frontier = [source]; // 本轮「刚收到消息、需要转发」的节点
  let round = 0;
  console.log(`第 0 跳：节点 ${source} 产生/收到消息，开始广播`);
  while (frontier.length > 0) {
    round++;
    const next = [];
    for (const id of frontier) {
      for (const peer of nodes[id].peers) {
        if (!nodes[peer].seen) {
          nodes[peer].seen = true; // 邻居第一次收到
          next.push(peer);
        }
      }
    }
    if (next.length > 0) {
      console.log(`第 ${round} 跳：新触达 ${next.length} 个节点 → [${next.join(", ")}]`);
    }
    frontier = next;
  }
  const reached = nodes.filter((nd) => nd.seen).length;
  console.log(`\n传播完成：共 ${round} 跳，触达 ${reached}/${nodes.length} 个节点。`);
}

console.log("========== P2P 网络：没有中心服务器，节点互相转发 ==========\n");
const NET_SIZE = 20;
const net = buildNetwork(NET_SIZE, 2);
console.log(`构建了一个 ${NET_SIZE} 节点的随机 P2P 网络，每个节点只认识几个邻居。`);
const avgDeg = (net.reduce((s, n) => s + n.peers.size, 0) / NET_SIZE).toFixed(1);
console.log(`平均每个节点有 ${avgDeg} 个邻居。\n`);

console.log("现在节点 0 发出一笔新交易(或新区块)，看它如何靠邻居转发传遍全网：\n");
gossip(net, 0);

console.log("\n👉 要点：");
console.log("  · 无中心：任何节点都可加入/退出，网络自愈，无单点故障。");
console.log("  · 冗余广播：每条消息经多条路径抵达，抗丢包、抗节点作恶。");
console.log("  · 收到即校验：诚实节点会验证交易签名/区块哈希，非法消息不再转发 → 坏消息传不远。");
console.log("  · 传播跳数≈网络直径的对数级，全网通常几秒内同步一条消息。");
