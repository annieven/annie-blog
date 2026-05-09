/**
 * PostPreviewImage - 可重用的文章預覽圖片組件
 * 
 * 用於在首頁、作者頁面、標籤頁面等地方統一顯示文章預覽圖片
 * 特性：
 * - 高度固定為 240px，最大高度 40vh
 * - 寬度自適應（fit-content），圖片向左對齊
 * - 使用 object-contain 確保圖片完整顯示
 * - 圓角和背景顏色
 */

interface PostPreviewImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function PostPreviewImage({ src, alt, className = "" }: PostPreviewImageProps) {
  return (
    <div 
      className={`mb-6 rounded-lg overflow-hidden bg-gray-100 ${className}`}
      style={{ 
        height: '240px', 
        maxHeight: '40vh', 
        width: 'fit-content', 
        marginLeft: '0' 
      }}
    >
      <img
        src={src}
        alt={alt}
        className="h-full object-contain"
      />
    </div>
  );
}
