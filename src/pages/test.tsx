import { useEffect, useState, useRef } from 'react';

const TestPage = () => {
  const ref = useRef<HTMLParagraphElement | null>(null);
  const ref2 = useRef<string>('');
  const [state, setState] = useState(true);
  // const [state2, setState2] = useState();
  // console.log();
  console.log('Root', ref);

  useEffect(() => {
    if (!state) return;

    console.log('Use Effect', ref);

    ref2.current = 'Duhhhhhh';

    return () => {
      console.log('Ran cleanup', ref, ref2);
      // ref.current!.innerHTML = '';
    };
  }, [state]);

  return (
    <>
      {console.log('Return')}
      <p
        ref={(el) => {
          ref.current = el;
          setState(true);
        }}
      >
        Test
      </p>
    </>
  );
};

export default TestPage;
