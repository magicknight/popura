import test from 'ava';
import instance from '../instance';

test('Can search for animes', t => {
	t.notThrows(instance.searchAnimes('Full Metal'));
});

test('Can search for mangas', t => {
	t.notThrows(instance.searchMangas('Full Metal'));
});