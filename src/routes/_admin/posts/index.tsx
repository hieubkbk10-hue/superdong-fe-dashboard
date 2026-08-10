import React, { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Search, Plus, Edit, Trash2, ExternalLink, Copy, GripVertical, SlidersHorizontal, ChevronDown, FileText } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_admin/posts/')({
  component: PostsListPageComponent,
});

interface PostItem {
  id: string;
  title: string;
  category: string;
  views: number;
  status: 'Published' | 'Draft' | 'Archived';
}

function PostsListPageComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);

  const filteredPosts = posts.filter((post) => {
    const matchSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !filterStatus || post.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredPosts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPosts.map((p) => p.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDelete = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast.success('Đã xóa bài viết thành công');
  };

  const handleDuplicate = (title: string) => {
    toast.success(`Đã tạo bản sao: ${title}`);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Top Title & Add Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Quản lý bài viết Tin Tức &amp; Thông Báo
        </h1>
        <button
          type="button"
          onClick={() => toast.info('Chức năng thêm bài viết tin tức')}
          className="h-10 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
        >
          <Plus size={16} />
          <span>Thêm bài viết mới</span>
        </button>
      </div>

      {/* Filter Card */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm bài viết..."
              className="w-full h-10 pl-9 pr-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Published">Hiện</option>
              <option value="Draft">Ẩn</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('');
              }}
              className="h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Xóa lọc
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredPosts.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="w-8 py-3 px-2" />
                <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Thumbnail</th>
                <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Tiêu đề ↕</th>
                <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Danh mục ↕</th>
                <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Trạng thái ↕</th>
                <th className="py-3 px-4 text-right font-semibold text-slate-600 dark:text-slate-400">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-normal">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Chưa có bài viết tin tức nào.
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr
                    key={post.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(post.id)}
                        onChange={() => toggleSelectItem(post.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-2 text-slate-400 cursor-grab">
                      <GripVertical size={16} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-9 w-14 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] text-slate-400">
                        <FileText size={16} className="text-slate-400" />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate">
                      {post.title}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{post.category}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white">
                        Hiện
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => toast.info(`Xem bài viết: ${post.title}`)}
                          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 cursor-pointer"
                          title="Xem bài viết"
                        >
                          <ExternalLink size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicate(post.title)}
                          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
                          title="Copy bài viết"
                        >
                          <Copy size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(post.id)}
                          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500 hover:text-rose-600 cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
