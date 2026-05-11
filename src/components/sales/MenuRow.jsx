import { useState } from 'react';
import styles from '@/app/(pages)/sales/popup/AddSalesPopup.module.scss';
import period from '@/components/sales/DateSelectTab.module.scss';

export default function MenuRow({ item, idx, isEditing, checked, onCheckChange, onEditStart, onEditSubmit, menuData }) {
  const [editSelected, setEditSelected] = useState('');
  const [editCount, setEditCount] = useState('');
  const [editOpenDropdown, setEditOpenDropdown] = useState(false);

  const editAmount = (() => {
    const menu = menuData.find(m => m.name === editSelected);
    if (!menu) return 0;
    return Number(menu.price.toString().replace(/,/g, '')) * Number(editCount || 0);
  })();

  const handleEditStart = () => {
    setEditSelected(item.name);
    setEditCount(item.count);
    setEditOpenDropdown(false);
    onEditStart();
  };

  const handleEditSubmit = () => {
    onEditSubmit({ name: editSelected, count: Number(editCount), sales: editAmount });
  };

  return (
    <div className={styles.oneline}>

      {/* 체크박스: 수정 모드일 때 숨김 */}
      {isEditing
        ? <div className={styles.checkboxNone}></div>
        : <input
            type="checkbox"
            className={styles.checkbox}
            checked={checked ?? false}
            onChange={onCheckChange}
          />
      }

      <form
        className={styles.text}
        onSubmit={e => { e.preventDefault(); handleEditSubmit(); }}
      >
        {/* 메뉴명 */}
        {isEditing
          ? <div className={`${period.period} ${styles.period}`}>
              <div className={`${period.periodItem} ${styles.periodItem}`}>
                <div
                  className={`${period.periodBtn} ${styles.periodBtn}`}
                  onClick={() => setEditOpenDropdown(v => !v)}
                >
                  {editSelected}
                  <p><img src="./img/icon/ic-down.svg" alt="펼침아이콘" /></p>
                </div>
                {editOpenDropdown && (
                  <ul className={`${period.dropdown} ${styles.dropdown}`}>
                    {menuData.map((m, i) => (
                      <li
                        key={i}
                        className={editSelected === m.name ? period.dropdownActive : ''}
                        onClick={() => { setEditSelected(m.name); setEditOpenDropdown(false); }}
                      >
                        {m.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          : <div>{item.name}</div>
        }

        {/* 판매량 */}
        {isEditing
          ? <div className={styles.editInput}>
              <input
                type="text"
                value={editCount}
                placeholder="판매량 입력"
                onChange={e => setEditCount(e.target.value)}
              />
            </div>
          : <div>{item.count}</div>
        }

        {/* 판매금액 */}
        <div>
          {isEditing ? Number(editAmount).toLocaleString() : Number(item.sales).toLocaleString()}
        </div>
      </form>

      {/* 수정/확인 버튼 */}
      {isEditing
        ? <p className={styles.editBtn} onClick={handleEditSubmit}>
            <img src="./img/icon/ic-plus(white).svg" alt="확인버튼" />
          </p>
        : <p className={styles.editBtn} onClick={handleEditStart}>
            <img src="./img/icon/ic-edit.svg" alt="수정아이콘" />
          </p>
      }
    </div>
  );
}
