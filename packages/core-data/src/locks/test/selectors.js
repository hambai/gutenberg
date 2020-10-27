/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import { getPendingLockRequests, isLockAvailable } from '../selectors';
import { deepCopyLocksTreePath, getNode } from '../utils';

describe( 'getPendingLockRequests', () => {
	it( 'returns pending lock requests', () => {
		const state = deepFreeze( {
			locks: {
				requests: [ 1, 2, 3 ],
			},
		} );

		expect( getPendingLockRequests( state ) ).toEqual( [ 1, 2, 3 ] );
	} );
} );

describe( 'isLockAvailable', () => {
	describe( 'smoke tests', () => {
		it( 'returns true if lock is available', () => {
			const state = deepFreeze( {
				locks: {
					locks: {
						children: {},
						locks: [],
					},
				},
			} );

			expect( isLockAvailable( state, [], { exclusive: true } ) ).toBe(
				true
			);
		} );
		it( 'returns true if lock is not available', () => {
			const state = deepFreeze( {
				locks: {
					locks: {
						children: {},
						locks: [ { exclusive: false } ],
					},
				},
			} );

			expect( isLockAvailable( state, [], { exclusive: true } ) ).toBe(
				false
			);
		} );
	} );

	describe( 'Advanced cases - exclusive lock', () => {
		let state;
		beforeEach( () => {
			state = buildState( [
				[ 'core', 'entities', 'root', 'template_part', '3' ],
			] );
		} );
		it( `returns true if no parent or descendant has any locks`, () => {
			expect(
				isLockAvailable(
					deepFreeze( state ),
					[ 'core', 'entities', 'root' ],
					{ exclusive: true }
				)
			).toBe( true );
		} );

		[ true, false ].forEach( ( exclusive ) => {
			it( `returns false if top-level parent already has a lock with exclusive=${ exclusive }`, () => {
				appendLock( state, [], {
					exclusive,
				} );
				expect(
					isLockAvailable(
						deepFreeze( state ),
						[ 'core', 'entities', 'root' ],
						{ exclusive: true }
					)
				).toBe( false );
			} );

			it( `returns false if a direct parent already has a lock with exclusive=${ exclusive }`, () => {
				appendLock( state, [ 'core', 'children' ], {
					exclusive,
				} );
				expect(
					isLockAvailable(
						deepFreeze( state ),
						[ 'core', 'entities', 'root' ],
						{ exclusive: true }
					)
				).toBe( false );
			} );

			it( `returns false if the target node already has a lock with exclusive=${ exclusive }`, () => {
				appendLock( state, [ 'core', 'children', 'root' ], {
					exclusive,
				} );
				expect(
					isLockAvailable(
						deepFreeze( state ),
						[ 'core', 'entities', 'root' ],
						{ exclusive: true }
					)
				).toBe( false );
			} );

			it( `returns false if a children node already has a lock with exclusive=${ exclusive }`, () => {
				appendLock(
					state,
					[ 'core', 'children', 'root', 'template_part' ],
					{
						exclusive,
					}
				);
				expect(
					isLockAvailable(
						deepFreeze( state ),
						[ 'core', 'entities', 'root' ],
						{ exclusive: true }
					)
				).toBe( false );
			} );

			it( `returns false if a grand-children node already has a lock with exclusive=${ exclusive }`, () => {
				appendLock(
					state,
					[ 'core', 'children', 'root', 'template_part', '3' ],
					{
						exclusive,
					}
				);
				expect(
					isLockAvailable(
						deepFreeze( state ),
						[ 'core', 'entities', 'root' ],
						{ exclusive: true }
					)
				).toBe( false );
			} );
		} );
	} );

	describe( 'Advanced cases - shared lock', () => {
		let state;
		beforeEach( () => {
			state = buildState( [
				[ 'core', 'entities', 'root', 'template_part', '3' ],
			] );
		} );
		it( `returns true if no parent or descendant has any locks`, () => {
			expect(
				isLockAvailable(
					deepFreeze( state ),
					[ 'core', 'entities', 'root' ],
					{ exclusive: true }
				)
			).toBe( true );
		} );

		[ true, false ].forEach( ( isOtherLockExclusive ) => {
			const expectation = ! isOtherLockExclusive;
			it( `returns ${ expectation } if top-level parent already has a lock with exclusive=${ isOtherLockExclusive }`, () => {
				appendLock( state, [], {
					exclusive: isOtherLockExclusive,
				} );
				expect(
					isLockAvailable(
						deepFreeze( state ),
						[ 'core', 'entities', 'root' ],
						{ exclusive: false }
					)
				).toBe( expectation );
			} );

			it( `returns ${ expectation } if a direct parent already has a lock with exclusive=${ isOtherLockExclusive }`, () => {
				appendLock( state, [ 'core', 'children' ], {
					exclusive: isOtherLockExclusive,
				} );
				expect(
					isLockAvailable(
						deepFreeze( state ),
						[ 'core', 'entities', 'root' ],
						{ exclusive: false }
					)
				).toBe( expectation );
			} );

			it( `returns ${ expectation } if the target node already has a lock with exclusive=${ isOtherLockExclusive }`, () => {
				appendLock( state, [ 'core', 'children', 'root' ], {
					exclusive: isOtherLockExclusive,
				} );
				expect(
					isLockAvailable(
						deepFreeze( state ),
						[ 'core', 'entities', 'root' ],
						{ exclusive: false }
					)
				).toBe( expectation );
			} );

			it( `returns ${ expectation } if a children node already has a lock with exclusive=${ isOtherLockExclusive }`, () => {
				appendLock(
					state,
					[ 'core', 'children', 'root', 'template_part' ],
					{
						exclusive: isOtherLockExclusive,
					}
				);
				expect(
					isLockAvailable(
						deepFreeze( state ),
						[ 'core', 'entities', 'root' ],
						{ exclusive: false }
					)
				).toBe( expectation );
			} );

			it( `returns ${ expectation } if a grand-children node already has a lock with exclusive=${ isOtherLockExclusive }`, () => {
				appendLock(
					state,
					[ 'core', 'children', 'root', 'template_part', '3' ],
					{
						exclusive: isOtherLockExclusive,
					}
				);
				expect(
					isLockAvailable(
						deepFreeze( state ),
						[ 'core', 'entities', 'root' ],
						{ exclusive: false }
					)
				).toBe( expectation );
			} );
		} );
	} );
} );

function appendLock( state, path, lock ) {
	getNode( path, state.locks.locks ).locks.push( lock );
}

function buildState( paths ) {
	return {
		locks: {
			requests: [],
			locks: paths.reduce(
				( tree, path ) => deepCopyLocksTreePath( tree, path ),
				{
					locks: [],
					children: {},
				}
			),
		},
	};
}
