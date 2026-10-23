import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { NewsItem } from '@/types';

export const dynamic = 'force-dynamic';

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
  },
  timeout: 8000,
});

// Cache in-memory trong 3 phút để tăng tốc độ tải trang
let cachedNews: NewsItem[] | null = null;
let lastCacheTime = 0;
const CACHE_DURATION_MS = 3 * 60 * 1000;

function formatTimeAgo(dateStr?: string): string {
  if (!dateStr) return 'Vừa xong';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - d.getTime()) / 60000);

    if (diffMinutes <= 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Hôm qua';
    return `${diffDays} ngày trước`;
  } catch {
    return 'Gần đây';
  }
}

async function fetchFeaturedNews(): Promise<NewsItem[]> {
  const sources = [
    {
      name: 'CafeF',
      urls: [
        'https://cafef.vn/thi-truong-chung-khoan.rss',
        'https://cafef.vn/rss/thi-truong-chung-khoan.rss',
        'https://cafef.vn/home.rss',
      ],
    },
    {
      name: 'VnExpress',
      urls: [
        'https://vnexpress.net/rss/kinh-doanh.rss',
      ],
    },
  ];

  const newsList: NewsItem[] = [];

  for (const source of sources) {
    let feed: any = null;

    for (const url of source.urls) {
      try {
        feed = await parser.parseURL(url);
        if (feed && feed.items && feed.items.length > 0) {
          break;
        }
      } catch (err: any) {
        // Thử URL kế tiếp nếu có lỗi
      }
    }

    if (feed && Array.isArray(feed.items)) {
      // Lấy 3 tin mới nhất từ mỗi nguồn theo yêu cầu
      const topItems: NewsItem[] = feed.items.slice(0, 3).map((item: any, idx: number) => ({
        id: item.guid || item.link || `${source.name}-${idx}-${Date.now()}`,
        source: source.name,
        title: (item.title || '').trim().replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
        timeAgo: formatTimeAgo(item.pubDate || item.isoDate),
        url: item.link,
      }));
      newsList.push(...topItems);
    }
  }

  // Sắp xếp lại theo thời gian mới nhất
  return newsList.sort((a, b) => {
    const timeA = a.timeAgo.includes('phút') ? 1 : a.timeAgo.includes('giờ') ? 2 : 3;
    const timeB = b.timeAgo.includes('phút') ? 1 : b.timeAgo.includes('giờ') ? 2 : 3;
    return timeA - timeB;
  });
}

// Dữ liệu dự phòng khi cả hai nguồn cấp RSS không phản hồi
const FALLBACK_NEWS: NewsItem[] = [
  {
    id: 'fb-1',
    title: 'VN-Index duy trì đà hồi phục, dòng tiền quay lại nhóm cổ phiếu ngân hàng và thép',
    source: 'CafeF',
    timeAgo: '15 phút trước',
    url: 'https://cafef.vn/thi-truong-chung-khoan.chn',
  },
  {
    id: 'fb-2',
    title: 'Khối ngoại đảo chiều mua ròng trên HOSE, tập trung vào nhóm VN30',
    source: 'VnExpress',
    timeAgo: '45 phút trước',
    url: 'https://vnexpress.net/kinh-doanh',
  },
  {
    id: 'fb-3',
    title: 'Thị trường chứng khoán Việt Nam đón dòng vốn mới từ các quỹ ETF',
    source: 'CafeF',
    timeAgo: '2 giờ trước',
    url: 'https://cafef.vn/thi-truong-chung-khoan.chn',
  },
  {
    id: 'fb-4',
    title: 'Giá dầu thế giới biến động mạnh, nhóm dầu khí trong nước phân hóa',
    source: 'VnExpress',
    timeAgo: '3 giờ trước',
    url: 'https://vnexpress.net/kinh-doanh',
  },
];

export async function GET() {
  try {
    const now = Date.now();
    if (cachedNews && (now - lastCacheTime < CACHE_DURATION_MS)) {
      return NextResponse.json({
        success: true,
        data: cachedNews,
        cached: true,
      });
    }

    const news = await fetchFeaturedNews();

    if (news.length > 0) {
      cachedNews = news;
      lastCacheTime = now;
      return NextResponse.json({
        success: true,
        data: news,
        cached: false,
      });
    }

    // Nếu không cào được tin nào, trả về fallback
    return NextResponse.json({
      success: true,
      data: cachedNews || FALLBACK_NEWS,
      fallback: true,
    });
  } catch (error: any) {
    console.error('Lỗi API /api/news:', error);
    return NextResponse.json({
      success: true,
      data: cachedNews || FALLBACK_NEWS,
      fallback: true,
      error: error.message,
    });
  }
}
