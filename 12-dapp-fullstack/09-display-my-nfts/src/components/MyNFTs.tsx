// 「我的 NFT」列表：读取当前钱包拥有的所有 NFT 并展示图片 + 名称。
//
// 读取思路（全部是链上「读」，不花 Gas）：
//   1. balanceOf(我)                     → 我有几枚 count
//   2. 循环 tokenOfOwnerByIndex(我, i)    → 每一枚的 tokenId（Enumerable 扩展提供）
//   3. tokenURI(tokenId)                 → 每一枚的元数据地址 ipfs://...
//   4. fetch 该 JSON（经 IPFS 网关）      → 拿到 name / image，渲染出来
//
// 第 2、3 步是「同一个函数、不同参数」的批量读，用 wagmi 的 useReadContracts（复数）
// 一次性并发请求，比逐个 useReadContract 高效。
import { useEffect, useState } from 'react'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import { MyNFTAbi } from '../contract/abi'
import { CONTRACT_ADDRESS } from '../contract/address'

// 把 ipfs://CID/xx 转成可被浏览器 fetch 的网关 https 地址
function ipfsToHttp(uri: string) {
  return uri.startsWith('ipfs://')
    ? uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
    : uri
}

type Meta = { name?: string; image?: string }

export function MyNFTs() {
  const { address } = useAccount()

  // 1) 我持有几枚
  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MyNFTAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }, // 没连钱包就不发请求
  })

  const count = balance ? Number(balance) : 0

  // 2) 批量读每一枚的 tokenId：tokenOfOwnerByIndex(address, 0..count-1)
  const { data: tokenIdResults } = useReadContracts({
    contracts: Array.from({ length: count }, (_, i) => ({
      address: CONTRACT_ADDRESS,
      abi: MyNFTAbi,
      functionName: 'tokenOfOwnerByIndex',
      args: [address!, BigInt(i)],
    })),
    query: { enabled: count > 0 },
  })

  const tokenIds =
    tokenIdResults?.map((r) => (r.status === 'success' ? (r.result as bigint) : null)).filter((x): x is bigint => x !== null) ?? []

  // 3) 批量读每一枚的 tokenURI
  const { data: uriResults } = useReadContracts({
    contracts: tokenIds.map((id) => ({
      address: CONTRACT_ADDRESS,
      abi: MyNFTAbi,
      functionName: 'tokenURI',
      args: [id],
    })),
    query: { enabled: tokenIds.length > 0 },
  })

  // 4) 根据 tokenURI 去网关拉取元数据 JSON（name / image）
  const [metas, setMetas] = useState<Record<string, Meta>>({})
  useEffect(() => {
    if (!uriResults) return
    uriResults.forEach(async (r, i) => {
      if (r.status !== 'success') return
      const uri = r.result as string
      const id = tokenIds[i].toString()
      if (metas[id]) return // 已拉过就跳过
      try {
        const res = await fetch(ipfsToHttp(uri))
        const json: Meta = await res.json()
        setMetas((prev) => ({ ...prev, [id]: json }))
      } catch {
        setMetas((prev) => ({ ...prev, [id]: { name: `#${id}（元数据加载失败）` } }))
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uriResults])

  if (!address) return null

  return (
    <section style={{ marginTop: 24 }}>
      <h2>② 我的 NFT（{count}）</h2>
      {count === 0 && <p style={{ color: '#666' }}>还没有 NFT，先在上面铸造一枚吧。</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {tokenIds.map((id) => {
          const meta = metas[id.toString()]
          return (
            <div key={id.toString()} style={{ border: '1px solid #eee', borderRadius: 12, padding: 8 }}>
              {meta?.image ? (
                <img src={ipfsToHttp(meta.image)} alt={meta.name} style={{ width: '100%', borderRadius: 8 }} />
              ) : (
                <div style={{ height: 140, background: '#f5f5f5', borderRadius: 8 }} />
              )}
              <p style={{ fontSize: 14, margin: '8px 0 0' }}>{meta?.name ?? `Token #${id.toString()}`}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
